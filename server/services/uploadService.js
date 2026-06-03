const cloudinary = require('cloudinary').v2;

let configured = false;

const ensureConfig = () => {
    if (configured) return;
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        const err = new Error('Cloudinary environment variables are not set.');
        err.status = 500;
        throw err;
    }
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
    configured = true;
};

const uploadFile = (file) => {
    ensureConfig();
    return { filePath: file.path, publicId: file.filename };
};

const deleteFile = async (publicId) => {
    ensureConfig();
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== 'ok') {
        const err = new Error('File not found on Cloudinary.');
        err.status = 404;
        throw err;
    }
    return { message: 'File deleted successfully.' };
};

const getCloudinary = () => {
    ensureConfig();
    return cloudinary;
};

module.exports = { uploadFile, deleteFile, getCloudinary };
