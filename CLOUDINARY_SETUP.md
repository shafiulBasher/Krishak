# Cloudinary Integration for Vercel Deployment

## Why Cloudinary?
Vercel serverless functions have a read-only file system. Uploaded files cannot be stored locally and must use a cloud storage service like Cloudinary.

## Setup Steps

### 1. Create Cloudinary Account
1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account (25 GB storage, 25 GB bandwidth/month)
3. Verify email
4. Note your credentials from Dashboard

### 2. Install Dependencies
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### 3. Update uploadMiddleware.js

Replace `backend/middleware/uploadMiddleware.js` with:

```javascript
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Allowed image MIME types
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
];

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('📸 File upload attempt:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected - invalid type:', file.mimetype);
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Cloudinary storage for product photos
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'krishak/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000000);
      return `product-${timestamp}-${random}`;
    }
  }
});

// Cloudinary storage for delivery photos
const deliveryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'krishak/deliveries',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1600, height: 1600, crop: 'limit', quality: 'auto' }
    ],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000000);
      return `photo-${timestamp}-${random}`;
    }
  }
});

// Multer upload for products (multiple photos)
const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Multer upload for deliveries (single photo)
const uploadDelivery = multer({
  storage: deliveryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle upload success
const handleUploadSuccess = (req, res, next) => {
  if (req.file) {
    console.log('📸 Photo uploaded to Cloudinary:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      url: req.file.path,
      size: req.file.size
    });
  } else if (req.files) {
    console.log('📸 Multiple photos uploaded to Cloudinary:', req.files.length);
  }
  next();
};

module.exports = {
  uploadProduct: [uploadProduct.array('photos', 5), handleUploadSuccess],
  uploadDelivery: [uploadDelivery.single('photo'), handleUploadSuccess]
};
```

### 4. Update Controllers

Since Cloudinary returns full URLs, update how you save photo paths:

**For Products (productController.js):**
```javascript
// OLD:
photos: req.files.map(file => `/uploads/products/${file.filename}`)

// NEW (Cloudinary returns full URL in file.path):
photos: req.files.map(file => file.path)
```

**For Deliveries (transporterController.js):**
```javascript
// OLD:
const photo = `/uploads/deliveries/${req.file.filename}`;

// NEW (Cloudinary returns full URL in file.path):
const photo = req.file.path;
```

### 5. Update Image Helper (Frontend)

Update `frontend/src/utils/imageHelper.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

console.log('🌐 Image Helper initialized:', { API_URL, BASE_URL });

/**
 * Get full image URL from relative or Cloudinary path
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If already a full URL (Cloudinary or other CDN), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If path starts with /, it's a backend path (backward compatibility)
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Get full URL for pickup/delivery photos
 */
export const getPhotoUrl = (photoObject) => {
  if (!photoObject || !photoObject.url) return '';
  return getImageUrl(photoObject.url);
};

export default { getImageUrl, getPhotoUrl };
```

### 6. Add Environment Variables

**Add to Vercel Backend Environment Variables:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Get these from:** https://cloudinary.com/console

### 7. Remove Local Storage Code

**Remove or comment out from server.js:**
```javascript
// OLD - Not needed with Cloudinary
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 8. Optional: Migration Script

If you have existing data with local file paths, create a migration script:

```javascript
// backend/scripts/migrateToCloudinary.js
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');
const Order = require('../models/Order');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateImages() {
  await mongoose.connect(process.env.MONGO_URI);
  
  console.log('🚀 Starting migration to Cloudinary...');
  
  // Migrate product photos
  const products = await Product.find({ photos: { $exists: true, $ne: [] } });
  console.log(`Found ${products.length} products with photos`);
  
  for (const product of products) {
    const newPhotos = [];
    for (const photo of product.photos) {
      if (photo.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '..', photo);
        if (fs.existsSync(localPath)) {
          try {
            const result = await cloudinary.uploader.upload(localPath, {
              folder: 'krishak/products',
              transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
            });
            newPhotos.push(result.secure_url);
            console.log(`✅ Uploaded: ${photo} → ${result.secure_url}`);
          } catch (error) {
            console.error(`❌ Failed to upload ${photo}:`, error.message);
            newPhotos.push(photo); // Keep original on error
          }
        } else {
          console.log(`⚠️ File not found: ${localPath}`);
          newPhotos.push(photo);
        }
      } else {
        newPhotos.push(photo); // Already a URL
      }
    }
    
    product.photos = newPhotos;
    await product.save();
  }
  
  // Migrate order photos (pickup & delivery)
  const orders = await Order.find({
    $or: [
      { 'pickupPhoto.url': { $regex: '^/uploads/' } },
      { 'deliveryProofPhoto.url': { $regex: '^/uploads/' } }
    ]
  });
  
  console.log(`Found ${orders.length} orders with photos to migrate`);
  
  for (const order of orders) {
    if (order.pickupPhoto?.url?.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', order.pickupPhoto.url);
      if (fs.existsSync(localPath)) {
        try {
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'krishak/deliveries'
          });
          order.pickupPhoto.url = result.secure_url;
          console.log(`✅ Uploaded pickup photo: ${result.secure_url}`);
        } catch (error) {
          console.error(`❌ Failed to upload pickup photo:`, error.message);
        }
      }
    }
    
    if (order.deliveryProofPhoto?.url?.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', order.deliveryProofPhoto.url);
      if (fs.existsSync(localPath)) {
        try {
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'krishak/deliveries'
          });
          order.deliveryProofPhoto.url = result.secure_url;
          console.log(`✅ Uploaded delivery photo: ${result.secure_url}`);
        } catch (error) {
          console.error(`❌ Failed to upload delivery photo:`, error.message);
        }
      }
    }
    
    await order.save();
  }
  
  console.log('✅ Migration complete!');
  process.exit(0);
}

migrateImages().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**Run migration:**
```bash
cd backend
node scripts/migrateToCloudinary.js
```

---

## Testing Cloudinary Integration

### Local Testing
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
# Add Cloudinary env vars to .env
node server.js
```

### Test Upload
1. Create a product with photos
2. Check Cloudinary Dashboard: https://cloudinary.com/console/media_library
3. Verify photos appear in `krishak/products` folder
4. Test delivery photo upload
5. Check `krishak/deliveries` folder

### Verify URLs
Photos should now be Cloudinary URLs:
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/krishak/products/product-xxxxx.jpg
```

---

## Cloudinary Features Used

### Automatic Optimization
- Format conversion (WebP for browsers that support it)
- Quality optimization
- Lazy loading support

### Transformations
- **Products:** Max 1200x1200px, quality auto
- **Deliveries:** Max 1600x1600px, quality auto
- Maintains aspect ratio

### Folders
- `krishak/products/` - Product photos
- `krishak/deliveries/` - Pickup and delivery verification photos

### Free Tier Limits
- 25 GB storage
- 25 GB bandwidth/month
- Unlimited transformations
- Perfect for development and small-scale production

---

## Backup Strategy

### 1. Keep Local Uploads (Development)
During development, keep local uploads folder as backup:
```javascript
// Use local storage in development
const useCloudinary = process.env.NODE_ENV === 'production';
const storage = useCloudinary ? productStorage : diskStorage;
```

### 2. Cloudinary Backups
- Enable backup add-on in Cloudinary (paid)
- Or periodically download from Cloudinary API
- Keep database backup with URLs

---

## Troubleshooting

### "Invalid credentials"
- Check CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
- Verify account is active
- Check for typos in environment variables

### "Upload failed"
- Check file size (5MB limit)
- Verify file format is allowed
- Check Cloudinary quota/limits
- View backend logs for details

### Images not displaying
- Verify Cloudinary URLs in database
- Check CORS settings in Cloudinary
- Test URL directly in browser
- Check frontend imageHelper.js

### Slow uploads
- Reduce transformation complexity
- Enable eager transformations
- Use smaller file sizes
- Check network connectivity

---

## Alternative: AWS S3

If you prefer AWS S3 over Cloudinary:

```bash
npm install aws-sdk multer-s3
```

Update uploadMiddleware.js to use S3 storage. Configuration is similar but requires AWS credentials and bucket setup.

---

## Production Checklist

- [ ] Cloudinary account created
- [ ] Dependencies installed
- [ ] uploadMiddleware.js updated
- [ ] Controllers updated to use file.path
- [ ] Frontend imageHelper.js updated
- [ ] Environment variables added to Vercel
- [ ] Local uploads removed/backed up
- [ ] Tested product photo upload
- [ ] Tested delivery photo upload
- [ ] Verified photos in Cloudinary dashboard
- [ ] Checked photo display in frontend
- [ ] Migrated existing photos (if any)

---

**✅ Cloudinary integration complete! Your uploads will now work on Vercel.** 🎉
