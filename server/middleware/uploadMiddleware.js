const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary with your credentials
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Set up the storage engine for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'orion_hrms', // A folder name in your Cloudinary account
        allowed_formats: ['jpeg', 'jpg', 'png', 'pdf'],
        // You can add transformations here if you want
        // transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
});

// Initialize multer with the Cloudinary storage engine
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB file size limit
});

module.exports = upload;