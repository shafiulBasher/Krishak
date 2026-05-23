const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const TransporterAssignment = require('../models/TransporterAssignment');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ROOT_DIR = path.join(__dirname, '..');
const UPLOADS_REGEX = /^\/?uploads\//i;

const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');
const dryRun = !applyChanges;
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;
const hasHelp = args.includes('--help') || args.includes('-h');

function printHelp() {
  console.log('Usage: node scripts/migrateLocalUploadsToCloudinary.js [--apply] [--limit=N]');
  console.log('');
  console.log('Modes:');
  console.log('  default      Dry run (no DB writes, no Cloudinary uploads)');
  console.log('  --apply      Upload local files to Cloudinary and update DB URLs');
  console.log('');
  console.log('Options:');
  console.log('  --limit=N    Process up to N documents per collection');
  console.log('  --help       Show this help');
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function isLocalUploadPath(value) {
  return typeof value === 'string' && UPLOADS_REGEX.test(value.replace(/\\/g, '/'));
}

function toAbsoluteLocalPath(relativeUploadPath) {
  const normalized = relativeUploadPath.replace(/\\/g, '/').replace(/^\//, '');
  return path.join(ROOT_DIR, normalized);
}

function makeReportPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(ROOT_DIR, `migration-report-${stamp}.json`);
}

async function uploadLocalFileToCloudinary(localPath, folder, publicIdPrefix) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000000);

  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: 'image',
    use_filename: false,
    unique_filename: false,
    public_id: `${publicIdPrefix}-${timestamp}-${random}`,
    overwrite: false
  });

  return result.secure_url;
}

async function main() {
  if (hasHelp) {
    printHelp();
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  if (applyChanges) {
    const required = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing Cloudinary env vars: ${missing.join(', ')}`);
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}`);
  if (limit > 0) {
    console.log(`Per-collection limit: ${limit}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const report = {
    mode: dryRun ? 'dry-run' : 'apply',
    startedAt: new Date().toISOString(),
    summary: {
      scanned: 0,
      candidates: 0,
      uploaded: 0,
      updated: 0,
      skippedMissingFile: 0,
      skippedAlreadyUrl: 0,
      errors: 0
    },
    collections: {
      products: { scanned: 0, updatedDocs: 0 },
      orders: { scanned: 0, updatedDocs: 0 },
      users: { scanned: 0, updatedDocs: 0 },
      transporterAssignments: { scanned: 0, updatedDocs: 0 }
    },
    errors: []
  };

  async function migrateValue(container, key, folder, idPrefix, context) {
    const current = container[key];

    if (!current) {
      return false;
    }

    if (isHttpUrl(current)) {
      report.summary.skippedAlreadyUrl += 1;
      return false;
    }

    if (!isLocalUploadPath(current)) {
      return false;
    }

    report.summary.candidates += 1;

    const absolutePath = toAbsoluteLocalPath(current);
    const exists = fs.existsSync(absolutePath);

    if (!exists) {
      report.summary.skippedMissingFile += 1;
      report.errors.push({
        type: 'missing_file',
        path: current,
        absolutePath,
        context
      });
      return false;
    }

    if (dryRun) {
      return true;
    }

    try {
      const secureUrl = await uploadLocalFileToCloudinary(absolutePath, folder, idPrefix);
      container[key] = secureUrl;
      report.summary.uploaded += 1;
      return true;
    } catch (error) {
      report.summary.errors += 1;
      report.errors.push({
        type: 'upload_error',
        path: current,
        absolutePath,
        context,
        message: error.message
      });
      return false;
    }
  }

  async function migrateProducts() {
    let query = Product.find({ photos: { $elemMatch: { $regex: '^/?uploads/' } } });
    if (limit > 0) query = query.limit(limit);
    const products = await query;

    for (const product of products) {
      report.collections.products.scanned += 1;
      report.summary.scanned += 1;

      let changed = false;
      const updatedPhotos = [];

      for (let i = 0; i < product.photos.length; i += 1) {
        const original = product.photos[i];

        if (!isLocalUploadPath(original)) {
          updatedPhotos.push(original);
          continue;
        }

        const wrapper = { value: original };
        const didChange = await migrateValue(
          wrapper,
          'value',
          'krishak_uploads/legacy/products',
          'product',
          { collection: 'products', documentId: String(product._id), field: `photos[${i}]` }
        );

        if (didChange) {
          changed = true;
          updatedPhotos.push(wrapper.value);
        } else {
          updatedPhotos.push(original);
        }
      }

      if (changed) {
        report.summary.updated += 1;
        report.collections.products.updatedDocs += 1;
        if (!dryRun) {
          product.photos = updatedPhotos;
          await product.save();
        }
      }
    }
  }

  async function migrateOrders() {
    let query = Order.find({
      $or: [
        { 'pickupPhoto.url': { $regex: '^/?uploads/' } },
        { 'deliveryProofPhoto.url': { $regex: '^/?uploads/' } },
        { 'statusHistory.photo': { $regex: '^/?uploads/' } }
      ]
    });
    if (limit > 0) query = query.limit(limit);
    const orders = await query;

    for (const order of orders) {
      report.collections.orders.scanned += 1;
      report.summary.scanned += 1;

      let changed = false;

      if (order.pickupPhoto?.url) {
        const didChange = await migrateValue(
          order.pickupPhoto,
          'url',
          'krishak_uploads/legacy/orders',
          'pickup',
          { collection: 'orders', documentId: String(order._id), field: 'pickupPhoto.url' }
        );
        if (didChange) changed = true;
      }

      if (order.deliveryProofPhoto?.url) {
        const didChange = await migrateValue(
          order.deliveryProofPhoto,
          'url',
          'krishak_uploads/legacy/orders',
          'delivery',
          { collection: 'orders', documentId: String(order._id), field: 'deliveryProofPhoto.url' }
        );
        if (didChange) changed = true;
      }

      for (let i = 0; i < order.statusHistory.length; i += 1) {
        const entry = order.statusHistory[i];
        if (!entry.photo) continue;

        const didChange = await migrateValue(
          entry,
          'photo',
          'krishak_uploads/legacy/orders',
          'history',
          { collection: 'orders', documentId: String(order._id), field: `statusHistory[${i}].photo` }
        );
        if (didChange) changed = true;
      }

      if (changed) {
        report.summary.updated += 1;
        report.collections.orders.updatedDocs += 1;
        if (!dryRun) {
          await order.save();
        }
      }
    }
  }

  async function migrateUsers() {
    let query = User.find({
      $or: [
        { avatar: { $regex: '^/?uploads/' } },
        { 'transporterProfile.vehiclePhotos': { $elemMatch: { $regex: '^/?uploads/' } } }
      ]
    });
    if (limit > 0) query = query.limit(limit);
    const users = await query;

    for (const user of users) {
      report.collections.users.scanned += 1;
      report.summary.scanned += 1;

      let changed = false;

      if (user.avatar) {
        const wrapper = { value: user.avatar };
        const didChange = await migrateValue(
          wrapper,
          'value',
          'krishak_uploads/legacy/users',
          'avatar',
          { collection: 'users', documentId: String(user._id), field: 'avatar' }
        );
        if (didChange) {
          changed = true;
          if (!dryRun) user.avatar = wrapper.value;
        }
      }

      const vehiclePhotos = user.transporterProfile?.vehiclePhotos || [];
      if (vehiclePhotos.length > 0) {
        const updatedVehiclePhotos = [];
        for (let i = 0; i < vehiclePhotos.length; i += 1) {
          const original = vehiclePhotos[i];
          if (!isLocalUploadPath(original)) {
            updatedVehiclePhotos.push(original);
            continue;
          }

          const wrapper = { value: original };
          const didChange = await migrateValue(
            wrapper,
            'value',
            'krishak_uploads/legacy/users',
            'vehicle',
            { collection: 'users', documentId: String(user._id), field: `transporterProfile.vehiclePhotos[${i}]` }
          );

          if (didChange) {
            changed = true;
            updatedVehiclePhotos.push(wrapper.value);
          } else {
            updatedVehiclePhotos.push(original);
          }
        }

        if (!dryRun && changed) {
          user.transporterProfile.vehiclePhotos = updatedVehiclePhotos;
        }
      }

      if (changed) {
        report.summary.updated += 1;
        report.collections.users.updatedDocs += 1;
        if (!dryRun) {
          await user.save();
        }
      }
    }
  }

  async function migrateTransporterAssignments() {
    let query = TransporterAssignment.find({
      $or: [
        { pickupPhoto: { $regex: '^/?uploads/' } },
        { deliveryPhoto: { $regex: '^/?uploads/' } }
      ]
    });
    if (limit > 0) query = query.limit(limit);
    const assignments = await query;

    for (const assignment of assignments) {
      report.collections.transporterAssignments.scanned += 1;
      report.summary.scanned += 1;

      let changed = false;

      const pickupWrapper = { value: assignment.pickupPhoto };
      const pickupChanged = await migrateValue(
        pickupWrapper,
        'value',
        'krishak_uploads/legacy/transporter',
        'pickup',
        { collection: 'transporterAssignments', documentId: String(assignment._id), field: 'pickupPhoto' }
      );
      if (pickupChanged) {
        changed = true;
        if (!dryRun) assignment.pickupPhoto = pickupWrapper.value;
      }

      const deliveryWrapper = { value: assignment.deliveryPhoto };
      const deliveryChanged = await migrateValue(
        deliveryWrapper,
        'value',
        'krishak_uploads/legacy/transporter',
        'delivery',
        { collection: 'transporterAssignments', documentId: String(assignment._id), field: 'deliveryPhoto' }
      );
      if (deliveryChanged) {
        changed = true;
        if (!dryRun) assignment.deliveryPhoto = deliveryWrapper.value;
      }

      if (changed) {
        report.summary.updated += 1;
        report.collections.transporterAssignments.updatedDocs += 1;
        if (!dryRun) {
          await assignment.save();
        }
      }
    }
  }

  await migrateProducts();
  await migrateOrders();
  await migrateUsers();
  await migrateTransporterAssignments();

  report.finishedAt = new Date().toISOString();
  report.reportFile = makeReportPath();

  fs.writeFileSync(report.reportFile, JSON.stringify(report, null, 2));

  console.log('Migration complete');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report written to: ${report.reportFile}`);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore
    }
  });
