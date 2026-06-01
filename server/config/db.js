const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isShuttingDown = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        if (isShuttingDown) return;
        logger.warn('MongoDB disconnected unexpectedly. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
        if (isShuttingDown) return;
        logger.error(`MongoDB connection error: ${err.message}`);
    });
};

const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`${signal} received. Starting graceful shutdown...`);

    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
    } catch (err) {
        logger.error('Error closing MongoDB connection:', err.message);
    }

    process.exit(0);
};

module.exports = { connectDB, gracefulShutdown };
