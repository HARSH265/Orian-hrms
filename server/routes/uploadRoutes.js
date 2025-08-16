const express = require('express');
const router = express.Router();
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
// Import our new Cloudinary-configured multer instance
const upload = require('../middleware/uploadMiddleware');

// The route now expects a field named 'file' in the form data
router.route('/').post(protect, upload.single('file'), uploadFile);

module.exports = router;