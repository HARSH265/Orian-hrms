const Kudos = require('../model/Kudos');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

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

const getAllKudos = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit }, { limit: 50 });
    const [kudos, total] = await Promise.all([
        Kudos.find()
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePictureUrl')
            .populate('recipient', 'name profilePictureUrl')
            .skip(skip)
            .limit(l),
        Kudos.countDocuments()
    ]);
    return { data: kudos, pagination: buildPagination(total, p, l) };
};

const getUserKudos = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { recipient: userId };
    const [kudos, total] = await Promise.all([
        Kudos.find(query)
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePictureUrl')
            .skip(skip)
            .limit(l),
        Kudos.countDocuments(query)
    ]);
    return { data: kudos, pagination: buildPagination(total, p, l) };
};

module.exports = {
    createKudos,
    getAllKudos,
    getUserKudos,
};
