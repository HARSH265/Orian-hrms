// In test-cloudinary.js
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

dotenv.config();

console.log("--- Starting Cloudinary Sanity Check ---");

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
        console.log("Attempting to connect to Cloudinary...");
        const usage = await cloudinary.api.usage();
        console.log("\n✅ SUCCESS! Connection to Cloudinary is working.");
        console.log("Cloud Name:", usage.cloud_name);
        console.log("Plan:", usage.plan);
    } catch (error) {
        console.error("\n❌ FAILED! Could not connect to Cloudinary.");
        console.error("This confirms the problem is with your credentials or network connection.");
        console.error("Full Error:", error.message);
    }
};

runTest();