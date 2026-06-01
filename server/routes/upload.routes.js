// In: server/routes/upload.routes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/authMiddleware');
const path = require('path'); // We still use this for the file filter
const logger = require('../utils/logger');

// --- Configuration ---
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    logger.error("\n\n!!! FATAL ERROR IN upload.routes.js !!!");
    logger.error("Cloudinary environment variables are not set in your .env file.");
    process.exit(1);
}

cloudinary.config({ 
    cloud_name: CLOUDINARY_CLOUD_NAME, 
    api_key: CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET 
});

// --- Multer Cloudinary Storage (Corrected) ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        // This function now only determines the resource_type
        const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
        let resourceType = 'image';
        if (fileExt === 'pdf') {
            resourceType = 'raw';
        }
        
        logger.info(`Uploading a .${fileExt} file. Setting resource_type to: ${resourceType}`);

        return {
            folder: 'orion_hrms',
            resource_type: resourceType,
             format: fileExt,
            // --- THE FIX: We have REMOVED the `public_id` property. ---
            // Let Cloudinary generate a secure, random filename with the correct extension.
        };
    },
});

// --- Multer Middleware (with improved filter) ---
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Only images (jpeg, jpg, png) and PDF files are allowed!'));
        }
    }
});

// --- The Routes (No changes needed here, they are correct) ---
router.post('/', protect, upload.single('file'), (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File upload failed. Please check file type and size.' });
        }
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully!',
            filePath: req.file.path,
            public_id: req.file.filename // This will now contain the random ID from Cloudinary
        });
    } catch (error) {
        logger.error("Error in upload route:", error);
        next(error);

    }
});

router.delete('/', protect, async (req, res, next) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ success: false, message: 'Public ID is required.' });
        }
        // This logic is still correct because req.file.filename will contain the public_id
        const result = await cloudinary.uploader.destroy(public_id);
        if (result.result === 'ok') {
            res.status(200).json({ success: true, message: 'File deleted successfully.' });
        } else {
            res.status(404).json({ success: false, message: 'File not found on Cloudinary.' });
        }
    } catch (error) {
        logger.error("Error deleting file from Cloudinary:", error);
        next(error);
    }
});

module.exports = router;