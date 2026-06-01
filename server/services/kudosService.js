const Kudos = require('../model/Kudos');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

const createKudos = async (sender, recipientId, message, companyValue, req) => {
    if (!recipientId || !message) {
        return { error: 'Recipient and message are required.', status: 400 };
    }
    if (recipientId === sender._id.toString()) {
        return { error: 'You cannot give kudos to yourself.', status: 400 };
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
        return { error: 'Recipient user not found.', status: 404 };
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
        link: `/profile/${recipientId}`,
        type: 'Kudos',
    }, req);

    return { data: newKudos };
};

const getAllKudos = async () => {
    const kudos = await Kudos.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name profilePictureUrl')
        .populate('recipient', 'name profilePictureUrl');
    return kudos;
};

const getUserKudos = async (userId) => {
    const kudos = await Kudos.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePictureUrl');
    return kudos;
};

module.exports = {
    createKudos,
    getAllKudos,
    getUserKudos,
};
