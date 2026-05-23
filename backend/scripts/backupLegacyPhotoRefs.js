const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const TransporterAssignment = require('../models/TransporterAssignment');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find({
    photos: { $elemMatch: { $regex: '^/?uploads/' } }
  }).lean();

  const orders = await Order.find({
    $or: [
      { 'pickupPhoto.url': { $regex: '^/?uploads/' } },
      { 'deliveryProofPhoto.url': { $regex: '^/?uploads/' } },
      { 'statusHistory.photo': { $regex: '^/?uploads/' } }
    ]
  }).lean();

  const users = await User.find({
    $or: [
      { avatar: { $regex: '^/?uploads/' } },
      { 'transporterProfile.vehiclePhotos': { $elemMatch: { $regex: '^/?uploads/' } } }
    ]
  }).lean();

  const transporterAssignments = await TransporterAssignment.find({
    $or: [
      { pickupPhoto: { $regex: '^/?uploads/' } },
      { deliveryPhoto: { $regex: '^/?uploads/' } }
    ]
  }).lean();

  const backup = {
    createdAt: new Date().toISOString(),
    counts: {
      products: products.length,
      orders: orders.length,
      users: users.length,
      transporterAssignments: transporterAssignments.length
    },
    products,
    orders,
    users,
    transporterAssignments
  };

  const outputFile = `legacy-photo-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const outputPath = path.join(process.cwd(), outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2));

  console.log('Backup created:', outputPath);
  console.log('Counts:', backup.counts);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Backup failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
