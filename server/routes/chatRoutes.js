const express = require('express');
const router = express.Router();
const { 
    getConversationsForUser, 
    getMessagesForConversation, 
    findOrCreateConversation ,
    markConversationAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

router.get('/conversations', getConversationsForUser);
router.get('/conversations/:conversationId/messages', getMessagesForConversation);
router.post('/conversations', findOrCreateConversation);
router.post('/conversations/:conversationId/read', markConversationAsRead);

module.exports = router;