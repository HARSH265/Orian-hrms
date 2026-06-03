const chatService = require('../services/chatService');
const asyncHandler = require('../utils/asyncHandler');

exports.getConversationsForUser = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await chatService.getConversationsForUser(req.user.id, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.getMessagesForConversation = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page, limit } = req.query;

        const conversation = await chatService.getConversationById(conversationId, req.user.id);
        if (!conversation) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        const result = await chatService.getMessagesForConversation(conversationId, req.user.id, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.findOrCreateConversation = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required' });
        }
        if (recipientId === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot create a conversation with yourself' });
        }

        const user = await require('../model/user').findById(req.user.id);
        if (user && user.blockedUsers && user.blockedUsers.some(b => b.toString() === recipientId)) {
            return res.status(403).json({ success: false, message: 'Cannot start a conversation with a blocked user' });
        }

        const recipient = await require('../model/user').findById(recipientId);
        if (recipient && recipient.blockedUsers && recipient.blockedUsers.some(b => b.toString() === req.user.id)) {
            return res.status(403).json({ success: false, message: 'You have been blocked by this user' });
        }

        const { conversation, created } = await chatService.findOrCreateConversation(req.user.id, recipientId);
        const statusCode = created ? 201 : 200;
        res.status(statusCode).json({ success: true, data: conversation, message: created ? 'Conversation created.' : 'Conversation found.' });
    } catch (error) {
        next(error);
    }
});

exports.markConversationAsRead = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const totalUnreadCount = await chatService.markConversationAsRead(conversationId, req.user.id);
        res.status(200).json({ success: true, unreadCount: totalUnreadCount });
    } catch (error) {
        next(error);
    }
});

exports.createGroupConversation = asyncHandler(async (req, res, next) => {
    try {
        const { participantIds, groupName, groupDescription } = req.body;
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
            return res.status(400).json({ success: false, message: 'At least one participant is required' });
        }
        if (!groupName) {
            return res.status(400).json({ success: false, message: 'Group name is required' });
        }
        const conversation = await chatService.createGroupConversation(req.user.id, { participantIds, groupName, groupDescription });
        res.status(201).json({ success: true, data: conversation });
    } catch (error) {
        next(error);
    }
});

exports.addParticipant = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
        const conversation = await chatService.addParticipant(conversationId, req.user.id, userId);
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        next(error);
    }
});

exports.removeParticipant = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });
        const conversation = await chatService.removeParticipant(conversationId, req.user.id, userId);
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        next(error);
    }
});

exports.uploadChatAttachment = asyncHandler(async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        res.status(200).json({
            success: true,
            data: {
                fileUrl: req.file.path,
                publicId: req.file.filename,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
            },
        });
    } catch (error) {
        next(error);
    }
});

exports.editMessage = asyncHandler(async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
        const message = await chatService.editMessage(messageId, req.user.id, text);
        res.status(200).json({ success: true, data: message });
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.deleteMessage = asyncHandler(async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const result = await chatService.deleteMessage(messageId, req.user.id, deleteForEveryone);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.toggleReaction = asyncHandler(async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        if (!emoji) return res.status(400).json({ success: false, message: 'Emoji is required' });
        const message = await chatService.toggleReaction(messageId, req.user.id, emoji);
        res.status(200).json({ success: true, data: message });
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.blockUser = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (userId === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot block yourself' });
        }
        const result = await chatService.blockUser(req.user.id, userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.unblockUser = asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await chatService.unblockUser(req.user.id, userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

exports.getBlockedUsers = asyncHandler(async (req, res, next) => {
    try {
        const users = await chatService.getBlockedUsers(req.user.id);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});

exports.muteConversation = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const conversation = await chatService.muteConversation(conversationId, req.user.id);
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.searchMessages = asyncHandler(async (req, res, next) => {
    try {
        const { q, page, limit } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
        const result = await chatService.searchMessages(req.user.id, q, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.exportChat = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { headers, rows } = await chatService.exportChatMessages(conversationId, req.user.id);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="chat-${conversationId}.csv"`);
        res.status(200).send(csv);
    } catch (error) {
        next(error.statusCode ? error : { statusCode: 500, message: error.message });
    }
});

exports.getOnlineUsers = asyncHandler(async (req, res, next) => {
    try {
        const users = await chatService.getOnlineUsers(req.user.id);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
});
