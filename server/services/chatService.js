const Conversation = require('../model/conversationModel');
const Message = require('../model/messageModel');
const User = require('../model/user');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getConversationsForUser = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { participants: userId };
    const [conversations, total] = await Promise.all([
        Conversation.find(query)
            .populate({ path: 'participants', select: 'name profilePictureUrl systemRole isOnline lastSeen' })
            .populate({ path: 'lastMessage.sender', select: 'name profilePictureUrl' })
            .populate({ path: 'createdBy', select: 'name' })
            .populate({ path: 'admins', select: 'name' })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(l),
        Conversation.countDocuments(query)
    ]);

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
        conversationId: { $in: conversationIds },
        isRead: false,
        sender: { $ne: userId },
        deleted: false,
    });

    return { data: conversations, unreadCount, pagination: buildPagination(total, p, l) };
};

const getConversationById = async (conversationId, userId) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    }).populate({ path: 'participants', select: 'name profilePictureUrl systemRole isOnline lastSeen' })
      .populate({ path: 'createdBy', select: 'name profilePictureUrl' })
      .populate({ path: 'admins', select: 'name profilePictureUrl' });

    return conversation;
};

const getMessagesForConversation = async (conversationId, userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {
        conversationId,
        deleted: false,
        deletedFor: { $ne: userId },
    };
    const [messages, total] = await Promise.all([
        Message.find(query)
            .populate('sender', 'name profilePictureUrl')
            .populate('parentMessage')
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
        participants: { $all: participants, $size: 2 },
    });

    if (conversation) {
        const populatedConversation = await conversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
        return { conversation: populatedConversation, created: false };
    }

    const newConversation = await Conversation.create({ participants });
    const populatedConversation = await newConversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
    return { conversation: populatedConversation, created: true };
};

const createGroupConversation = async (userId, { participantIds, groupName, groupDescription }) => {
    const uniqueParticipants = [...new Set([userId, ...participantIds])];

    const conversation = await Conversation.create({
        participants: uniqueParticipants,
        isGroup: true,
        groupName,
        groupDescription,
        createdBy: userId,
        admins: [userId],
    });

    const populated = await conversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
    return populated;
};

const addParticipant = async (conversationId, userId, newParticipantId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw { statusCode: 404, message: 'Conversation not found' };
    if (!conversation.isGroup) throw { statusCode: 400, message: 'Cannot add participants to a 1-on-1 conversation' };

    const isAdmin = conversation.admins.some(a => a.toString() === userId);
    if (!isAdmin) throw { statusCode: 403, message: 'Only group admins can add participants' };

    if (conversation.participants.some(p => p.toString() === newParticipantId)) {
        throw { statusCode: 409, message: 'User is already a participant' };
    }

    conversation.participants.push(newParticipantId);
    await conversation.save();

    await Message.create({
        conversationId,
        sender: userId,
        text: `User added to the group`,
        messageType: 'system',
    });

    return conversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
};

const removeParticipant = async (conversationId, userId, targetUserId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw { statusCode: 404, message: 'Conversation not found' };
    if (!conversation.isGroup) throw { statusCode: 400, message: 'Cannot remove from a 1-on-1 conversation' };

    const isAdmin = conversation.admins.some(a => a.toString() === userId);
    if (!isAdmin && userId !== targetUserId) throw { statusCode: 403, message: 'Only group admins can remove participants' };

    if (userId === targetUserId) {
        conversation.participants = conversation.participants.filter(p => p.toString() !== targetUserId);
        conversation.admins = conversation.admins.filter(a => a.toString() !== targetUserId);
        await conversation.save();

        await Message.create({
            conversationId,
            sender: userId,
            text: `User left the group`,
            messageType: 'system',
        });

        return conversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
    }

    conversation.participants = conversation.participants.filter(p => p.toString() !== targetUserId);
    conversation.admins = conversation.admins.filter(a => a.toString() !== targetUserId);
    await conversation.save();

    await Message.create({
        conversationId,
        sender: userId,
        text: `User was removed from the group`,
        messageType: 'system',
    });

    return conversation.populate('participants', 'name profilePictureUrl systemRole isOnline lastSeen');
};

const markConversationAsRead = async (conversationId, userId) => {
    const now = new Date();
    await Message.updateMany(
        { conversationId, sender: { $ne: userId }, isRead: false, deleted: false },
        { $set: { isRead: true }, $push: { readBy: { user: userId, readAt: now } } }
    );

    const conversations = await Conversation.find({ participants: userId });
    const totalUnreadCount = await Message.countDocuments({
        conversationId: { $in: conversations.map(c => c._id) },
        isRead: false,
        sender: { $ne: userId },
        deleted: false,
    });

    return totalUnreadCount;
};

const saveMessage = async (conversationId, senderId, text, attachments = [], parentMessageId = null) => {
    let messageType = 'text';
    if (attachments.length > 0) {
        messageType = attachments.some(a => a.mimeType && a.mimeType.startsWith('image/')) ? 'image' : 'file';
    }

    const messageData = { conversationId, sender: senderId, text, messageType, attachments };
    if (parentMessageId) messageData.parentMessage = parentMessageId;

    const message = await Message.create(messageData);

    const lastMessage = { text, sender: senderId, createdAt: new Date(), messageType };
    if (attachments.length > 0) {
        lastMessage.attachments = attachments.map(a => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            mimeType: a.mimeType,
        }));
    }
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage });

    return message.populate('sender', 'name profilePictureUrl');
};

const editMessage = async (messageId, userId, newText) => {
    const message = await Message.findById(messageId);
    if (!message) throw { statusCode: 404, message: 'Message not found' };
    if (message.sender.toString() !== userId) throw { statusCode: 403, message: 'Can only edit your own messages' };
    if (message.deleted) throw { statusCode: 400, message: 'Cannot edit a deleted message' };

    message.text = newText;
    message.editedAt = new Date();
    await message.save();

    return message.populate('sender', 'name profilePictureUrl');
};

const deleteMessage = async (messageId, userId, deleteForEveryone = false) => {
    const message = await Message.findById(messageId);
    if (!message) throw { statusCode: 404, message: 'Message not found' };
    if (message.sender.toString() !== userId) throw { statusCode: 403, message: 'Can only delete your own messages' };

    if (deleteForEveryone) {
        message.deleted = true;
        await message.save();
    } else {
        message.deletedFor.push(userId);
        await message.save();
    }

    return { messageId, deleted: true };
};

const toggleReaction = async (messageId, userId, emoji) => {
    const message = await Message.findById(messageId);
    if (!message) throw { statusCode: 404, message: 'Message not found' };
    if (message.deleted) throw { statusCode: 400, message: 'Cannot react to a deleted message' };

    const existingIndex = message.reactions.findIndex(r => r.emoji === emoji && r.user.toString() === userId);

    if (existingIndex > -1) {
        message.reactions.splice(existingIndex, 1);
    } else {
        message.reactions.push({ emoji, user: userId });
    }

    await message.save();
    return message.populate('sender', 'name profilePictureUrl');
};

const blockUser = async (userId, blockedUserId) => {
    const user = await User.findById(userId);
    if (!user.blockedUsers) user.blockedUsers = [];
    if (user.blockedUsers.some(b => b.toString() === blockedUserId)) {
        throw { statusCode: 409, message: 'User is already blocked' };
    }
    user.blockedUsers.push(blockedUserId);
    await user.save();
    return { blockedUserId };
};

const unblockUser = async (userId, blockedUserId) => {
    const user = await User.findById(userId);
    if (!user.blockedUsers) return { blockedUserId };
    user.blockedUsers = user.blockedUsers.filter(b => b.toString() !== blockedUserId);
    await user.save();
    return { blockedUserId };
};

const getBlockedUsers = async (userId) => {
    const user = await User.findById(userId).populate('blockedUsers', 'name profilePictureUrl');
    return user.blockedUsers || [];
};

const muteConversation = async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw { statusCode: 404, message: 'Conversation not found' };

    if (conversation.mutedBy.some(m => m.toString() === userId)) {
        conversation.mutedBy = conversation.mutedBy.filter(m => m.toString() !== userId);
    } else {
        conversation.mutedBy.push(userId);
    }

    await conversation.save();
    return conversation;
};

const searchMessages = async (userId, query, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });

    const conversations = await Conversation.find({ participants: userId }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    const searchQuery = {
        conversationId: { $in: conversationIds },
        deleted: false,
        deletedFor: { $ne: userId },
        text: { $regex: query, $options: 'i' },
    };

    const [messages, total] = await Promise.all([
        Message.find(searchQuery)
            .populate('sender', 'name profilePictureUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Message.countDocuments(searchQuery),
    ]);

    return { data: messages, pagination: buildPagination(total, p, l) };
};

const exportChatMessages = async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw { statusCode: 404, message: 'Conversation not found' };
    if (!conversation.participants.some(p => p.toString() === userId)) {
        throw { statusCode: 403, message: 'Not authorized' };
    }

    const messages = await Message.find({
        conversationId,
        deleted: false,
        deletedFor: { $ne: userId },
    })
        .populate('sender', 'name email')
        .sort({ createdAt: 'asc' });

    const headers = ['timestamp', 'sender', 'email', 'message', 'messageType', 'hasAttachments'];
    const rows = messages.map(m => [
        m.createdAt.toISOString(),
        m.sender?.name || 'Unknown',
        m.sender?.email || '',
        m.text,
        m.messageType,
        m.attachments?.length > 0 ? 'Yes' : 'No',
    ]);

    return { headers, rows };
};

const getOnlineUsers = async (currentUserId) => {
    const users = await User.find({ isOnline: true, _id: { $ne: currentUserId } })
        .select('name profilePictureUrl _id');
    return users;
};

module.exports = {
    getConversationsForUser,
    getConversationById,
    getMessagesForConversation,
    findOrCreateConversation,
    createGroupConversation,
    addParticipant,
    removeParticipant,
    markConversationAsRead,
    saveMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    blockUser,
    unblockUser,
    getBlockedUsers,
    muteConversation,
    searchMessages,
    exportChatMessages,
    getOnlineUsers,
};
