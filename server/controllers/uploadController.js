const { uploadFile, deleteFile } = require('../services/uploadService');
const asyncHandler = require('../utils/asyncHandler');

exports.uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File upload failed. Please check file type and size.' });
    }
    const result = uploadFile(req.file);
    res.status(200).json({ success: true, message: 'File uploaded successfully!', filePath: result.filePath, public_id: result.publicId });
});

exports.deleteFile = asyncHandler(async (req, res) => {
    const { public_id } = req.body;
    if (!public_id) {
        return res.status(400).json({ success: false, message: 'Public ID is required.' });
    }
    const result = await deleteFile(public_id);
    res.status(200).json({ success: true, ...result });
});
