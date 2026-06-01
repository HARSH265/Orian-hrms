const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// We still load dotenv at the top
dotenv.config();

// --- THE FIX: Move configuration into the multer call ---
// This ensures that process.env is fully loaded when multer needs it.

const storage = new CloudinaryStorage({
    cloudinary: () => {
        // Configure cloudinary right when it's needed
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
        });
        return cloudinary;
    },
    params: {
        folder: 'orion_hrms',
        allowed_formats: ['jpeg', 'jpg', 'png', 'pdf'],
    },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        // Add a check inside the filter, which runs per-request
        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            // Pass an error to multer if config is missing
            return cb(new Error('Server configuration error: Cloudinary credentials not found.'));
        }
        cb(null, true); // Otherwise, allow the upload
    }
});

module.exports = upload;