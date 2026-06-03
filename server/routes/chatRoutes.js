const express = require('express');
const router = express.Router();
const {
    getConversationsForUser,
    getMessagesForConversation,
    findOrCreateConversation,
    markConversationAsRead,
    createGroupConversation,
    addParticipant,
    removeParticipant,
    uploadChatAttachment,
    editMessage,
    deleteMessage,
    toggleReaction,
    blockUser,
    unblockUser,
    getBlockedUsers,
    muteConversation,
    searchMessages,
    exportChat,
    getOnlineUsers,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const { featureEnabled } = require('../middleware/featureToggle');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(featureEnabled('chat'));

router.get('/conversations', getConversationsForUser);
router.get('/conversations/:conversationId/messages', getMessagesForConversation);
router.post('/conversations', findOrCreateConversation);
router.post('/conversations/:conversationId/read', markConversationAsRead);

router.post('/groups', createGroupConversation);
router.post('/groups/:conversationId/participants', writeLimiter, addParticipant);
router.delete('/groups/:conversationId/participants', writeLimiter, removeParticipant);

router.post('/upload', writeLimiter, upload.single('file'), uploadChatAttachment);

router.put('/messages/:messageId', writeLimiter, editMessage);
router.delete('/messages/:messageId', writeLimiter, deleteMessage);
router.post('/messages/:messageId/reactions', writeLimiter, toggleReaction);

router.post('/block/:userId', writeLimiter, blockUser);
router.delete('/block/:userId', writeLimiter, unblockUser);
router.get('/blocked', getBlockedUsers);

router.post('/conversations/:conversationId/mute', writeLimiter, muteConversation);

router.get('/search', searchMessages);
router.get('/conversations/:conversationId/export', exportChat);
router.get('/online', getOnlineUsers);

module.exports = router;
