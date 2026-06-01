// In test-cloudinary.js
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const logger = require('./utils/logger');

dotenv.config();

logger.info("--- Starting Cloudinary Sanity Check ---");

// Explicitly configure with the loaded variables
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// This is a simple API call to check if authentication works.
// It just asks for your account usage details.
const runTest = async () => {
    try {
        logger.info("Attempting to connect to Cloudinary...");
        const usage = await cloudinary.api.usage();
        logger.info("\n✅ SUCCESS! Connection to Cloudinary is working.");
        logger.info("Cloud Name:", usage.cloud_name);
        logger.info("Plan:", usage.plan);
    } catch (error) {
        logger.error("\n❌ FAILED! Could not connect to Cloudinary.");
        logger.error("This confirms the problem is with your credentials or network connection.");
        logger.error("Full Error:", error.message);
    }
};

runTest();