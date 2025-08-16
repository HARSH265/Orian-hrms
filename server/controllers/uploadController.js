// @desc    Upload a file to Cloudinary
// @route   POST /api/upload
// @access  Private
exports.uploadFile = (req, res) => {
    // The 'multer-storage-cloudinary' middleware automatically uploads the file
    // and adds a 'file' object to the request, which contains the Cloudinary URL.
    if (req.file) {
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            // Return the secure URL provided by Cloudinary
            filePath: req.file.path 
        });
    } else {
        res.status(400).json({ success: false, message: 'No file uploaded or file type is invalid.' });
    }
};