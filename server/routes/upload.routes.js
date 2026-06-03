const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const { uploadFile, deleteFile } = require('../controllers/uploadController');
const logger = require('../utils/logger');

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary env vars not set — uploads will fail until configured.');
} else {
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
        const resourceType = fileExt === 'pdf' ? 'raw' : 'image';
        return { folder: 'orion_hrms', resource_type: resourceType, format: fileExt };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 10 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Error: Only images (jpeg, jpg, png) and PDF files are allowed!'));
    },
});

const router = express.Router();

router.post('/', protect, writeLimiter, upload.single('file'), uploadFile);
router.delete('/', protect, writeLimiter, deleteFile);

module.exports = router;
