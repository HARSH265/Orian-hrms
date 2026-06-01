const Conversation = require('../model/conversationModel');
const Message = require('../model/messageModel');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getConversationsForUser = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { participants: userId };
    const [conversations, total] = await Promise.all([
        Conversation.find(query)
            .populate({ path: 'participants', select: 'name profilePictureUrl role' })
            .populate({ path: 'lastMessage.sender', select: 'name' })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(l),
        Conversation.countDocuments(query)
    ]);

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
        conversationId: { $in: conversationIds },
        isRead: false,
        sender: { $ne: userId }
    });

    return { data: conversations, unreadCount, pagination: buildPagination(total, p, l) };
};

const getConversationById = async (conversationId, userId) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
    });
    return conversation;
};

const getMessagesForConversation = async (conversationId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { conversationId };
    const [messages, total] = await Promise.all([
        Message.find(query)
            .populate('sender', 'name profilePictureUrl')
            .sort({ createdAt: 'asc' })
            .skip(skip)
            .limit(l),
        Message.countDocuments(query)
    ]);
    return { data: messages, pagination: buildPagination(total, p, l) };
};

const findOrCreateConversation = async (userId, recipientId) => {
    const participants = [userId, recipientId];
    participants.sort();

    let conversation = await Conversation.findOne({
        participants: { $all: participants, $size: 2 }
    });

    if (conversation) {
        const populatedConversation = await conversation.populate('participants', 'name profilePictureUrl role');
        return { conversation: populatedConversation, created: false };
    }

    const newConversation = await Conversation.create({ participants });
    const populatedConversation = await newConversation.populate('participants', 'name profilePictureUrl role');
    return { conversation: populatedConversation, created: true };
};

const markConversationAsRead = async (conversationId, userId) => {
    await Message.updateMany(
        { conversationId: conversationId, sender: { $ne: userId }, isRead: false },
        { $set: { isRead: true } }
    );

    const totalUnreadCount = await Message.countDocuments({
        conversationId: {
            $in: (await Conversation.find({ participants: userId })).map(c => c._id)
        },
        isRead: false,
        sender: { $ne: userId }
    });

    return totalUnreadCount;
};

module.exports = {
    getConversationsForUser,
    getConversationById,
    getMessagesForConversation,
    findOrCreateConversation,
    markConversationAsRead,
};
