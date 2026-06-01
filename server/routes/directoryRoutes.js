const express = require('express');
const router = express.Router();
const { getChatDirectory } = require('../controllers/directoryController');
const { protect } = require('../middleware/authMiddleware');

// This endpoint will return the list of users the current user is allowed to chat with.
router.get('/chat-directory', protect, getChatDirectory);

module.exports = router;