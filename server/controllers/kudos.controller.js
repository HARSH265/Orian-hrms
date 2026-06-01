// server/controllers/kudos.controller.js

const Kudos = require('../model/Kudos');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create new kudos
 * @route   POST /api/kudos
 * @access  Private
 */
exports.createKudos = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId, message, companyValue } = req.body;
        const sender = req.user; 

        if (!recipientId || !message) {
            return res.status(400).json({ success: false, message: 'Recipient and message are required.' });
        }
        if (recipientId === sender._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot give kudos to yourself.' });
        }
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Recipient user not found.' });
        }

        const newKudos = await Kudos.create({
            sender: sender._id,
            recipient: recipientId,
            message,
            companyValue,
        });

        await createNotification({
            recipient: recipientId,
            sender: sender._id,
            message: `${sender.name} gave you kudos!`,
            link: `/profile/${recipientId}`, // Updated link to a user's potential public profile
            type: 'Kudos',
        },req);
        
        res.status(201).json({ success: true, data: newKudos });

    } catch (error) {
        next(error);
    }
    });

/**
 * @desc    Get all public kudos (for the feed)
 * @route   GET /api/kudos
 * @access  Private
 */
exports.getAllKudos = asyncHandler(async (req, res, next) => {
    try {
        const kudos = await Kudos.find()
            .sort({ createdAt: -1 })
            .limit(50) // Limit to the 50 most recent kudos for performance
            .populate('sender', 'name profilePictureUrl')
            .populate('recipient', 'name profilePictureUrl');
        
        res.status(200).json({ success: true, count: kudos.length, data: kudos });
    } catch (error) {
        next(error);
    }
    });

/**
 * @desc    Get kudos received by a specific user
 * @route   GET /api/kudos/user/:userId
 * @access  Private
 */
exports.getUserKudos = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const kudos = await Kudos.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePictureUrl');
        
        res.status(200).json({ success: true, count: kudos.length, data: kudos });
    } catch (error) {
        next(error);
    }
    });

module.exports = {
    createKudos: exports.createKudos,
    getAllKudos: exports.getAllKudos,
    getUserKudos: exports.getUserKudos,
};