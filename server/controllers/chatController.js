const { getConversationsForUser, getConversationById, getMessagesForConversation, findOrCreateConversation, markConversationAsRead } = require('../services/chatService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversationsForUser = asyncHandler(async (req, res, next) => {
    try {
        const data = await getConversationsForUser(req.user.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// @desc    Get messages for a specific conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
exports.getMessagesForConversation = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;

        const conversation = await getConversationById(conversationId, req.user.id);

        if (!conversation) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        const messages = await getMessagesForConversation(conversationId);

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
});

// @desc    Find a 1-on-1 conversation with another user or create it
// @route   POST /api/chat/conversations
// @access  Private
exports.findOrCreateConversation = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required' });
        }
        if (recipientId === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot create a conversation with yourself' });
        }

        const { conversation, created } = await findOrCreateConversation(req.user.id, recipientId);

        const statusCode = created ? 201 : 200;
        const message = created ? 'Conversation created.' : 'Conversation found.';

        res.status(statusCode).json({ success: true, data: conversation, message });
    } catch (error) {
        next(error);
    }
});

// @desc    Mark all messages in a conversation as read
// @route   POST /api/chat/conversations/:conversationId/read
// @access  Private
exports.markConversationAsRead = asyncHandler(async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const totalUnreadCount = await markConversationAsRead(conversationId, req.user.id);
        res.status(200).json({ success: true, unreadCount: totalUnreadCount });
    } catch (error) {
        next(error);
    }
});
