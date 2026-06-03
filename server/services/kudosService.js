const Kudos = require('../model/Kudos');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const createKudos = async (sender, recipientId, message, companyValue, req) => {
    if (!recipientId || !message) {
        const err = new Error('Recipient and message are required.');
        err.status = 400; throw err;
    }
    if (recipientId === sender._id.toString()) {
        const err = new Error('You cannot give kudos to yourself.');
        err.status = 400; throw err;
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
        const err = new Error('Recipient user not found.');
        err.status = 404; throw err;
    }

    const newKudos = await Kudos.create({
        sender: sender._id, recipient: recipientId, message, companyValue,
    });

    await createAuditLog({
        actor: sender._id, action: 'KUDOS_SENT',
        target: { id: newKudos._id, type: 'Kudos' },
        details: { recipient: recipientId, message },
        ipAddress: req?.ip,
    });

    try {
        await createNotification({
            recipient: recipientId, sender: sender._id,
            message: `${sender.name} gave you kudos!`,
            link: `/profile/${recipientId}`, type: 'Kudos',
        }, req);
    } catch (notifErr) {
        logger.error('[KudosService] Failed to notify recipient:', notifErr);
    }

    return newKudos;
};

const getAllKudos = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit }, { limit: 50 });
    const [kudos, total] = await Promise.all([
        Kudos.find()
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePictureUrl')
            .populate('recipient', 'name profilePictureUrl')
            .skip(skip).limit(l),
        Kudos.countDocuments(),
    ]);
    return { data: kudos, pagination: buildPagination(total, p, l) };
};

const getUserKudos = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [kudos, total] = await Promise.all([
        Kudos.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePictureUrl')
            .skip(skip).limit(l),
        Kudos.countDocuments({ recipient: userId }),
    ]);
    return { data: kudos, pagination: buildPagination(total, p, l) };
};

const deleteKudos = async (id, userId, ip) => {
    const kudos = await Kudos.findById(id);
    if (!kudos) {
        const err = new Error('Kudos not found.');
        err.status = 404; throw err;
    }
    if (kudos.sender.toString() !== userId.toString()) {
        const err = new Error('Not authorized to delete this kudos.');
        err.status = 403; throw err;
    }
    await Kudos.findByIdAndDelete(id);
    await createAuditLog({
        actor: userId, action: 'KUDOS_DELETED',
        target: { id, type: 'Kudos' },
        ipAddress: ip,
    });
    return { message: 'Kudos deleted.' };
};

const exportKudosCSV = async (filter = {}) => {
    const kudos = await Kudos.find(filter)
        .populate('sender', 'name email')
        .populate('recipient', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Sender,Sender Email,Recipient,Recipient Email,Message,Company Value,Created At\n';
    const rows = kudos.map(k =>
        `"${k.sender?.name || ''}","${k.sender?.email || ''}","${k.recipient?.name || ''}","${k.recipient?.email || ''}","${(k.message || '').replace(/"/g, '""')}","${k.companyValue || ''}",${new Date(k.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = { createKudos, getAllKudos, getUserKudos, deleteKudos, exportKudosCSV };
