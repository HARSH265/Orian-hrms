const Conversation = require('../model/conversationModel');
const Message = require('../model/messageModel');
const User = require('../model/user'); // Assuming 'userModel.js' is the file name
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversationsForUser = asyncHandler(async (req, res, next) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'name profilePictureUrl role')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'name' }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: conversations });
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
        
        const conversation = await Conversation.findOne({ 
            _id: conversationId, 
            participants: req.user.id 
        });

        if (!conversation) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this conversation' });
        }

        const messages = await Message.find({ conversationId })
            .populate('sender', 'name profilePictureUrl')
            .sort({ createdAt: 'asc' });

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
    });

// @desc    Find a 1-on-1 conversation with another user or create it
// @route   POST /api/chat/conversations
// @access  Private
// server/controllers/chatController.js

// ...

// --- This is the final, correct version of the function ---
exports.findOrCreateConversation = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required' });
        }
        if (recipientId === req.user.id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot create a conversation with yourself' });
        }

        // 1. Create the participants array and SORT it to prevent duplicates.
        const participants = [req.user.id, recipientId];
        participants.sort();
        
        // 2. Find the conversation using the sorted participants array.
        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 }
        });

        if (conversation) {
             // 3. If found, POPULATE it with participant details before sending.
             conversation = await conversation.populate('participants', 'name profilePictureUrl role');
             return res.status(200).json({ success: true, data: conversation, message: 'Conversation found.' });
        }
       
        // 4. If not found, create it with the sorted participants.
        const newConversation = await Conversation.create({ participants });
        // 5. And POPULATE the new one before sending.
        const populatedConversation = await newConversation.populate('participants', 'name profilePictureUrl role');

        res.status(201).json({ success: true, data: populatedConversation, message: 'Conversation created.' });
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
        const userId = req.user.id;

        // Update all unread messages in this conversation where the user is NOT the sender
        await Message.updateMany(
            { conversationId: conversationId, sender: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );
        
        // We also need to get the total unread count for the user now
        const totalUnreadCount = await Message.countDocuments({
            // Find conversations the user is in
            conversationId: {
                $in: (await Conversation.find({ participants: userId })).map(c => c._id)
            },
            // Where the message is unread
            isRead: false,
            // And the user was not the sender
            sender: { $ne: userId }
        });

        res.status(200).json({ success: true, unreadCount: totalUnreadCount });
    } catch (error) {
        next(error);
    }
    });

exports.getConversationsForUser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Get all conversations the user is a part of.
        const conversations = await Conversation.find({ participants: userId })
            .populate({ path: 'participants', select: 'name profilePictureUrl role' })
            .populate({ path: 'lastMessage.sender', select: 'name' })
            .sort({ updatedAt: -1 });

        // 2. Get the IDs of all these conversations.
        const conversationIds = conversations.map(c => c._id);

        // 3. Calculate the total number of unread messages in all those conversations,
        //    where the current user was NOT the sender.
        const unreadCount = await Message.countDocuments({
            conversationId: { $in: conversationIds },
            isRead: false,
            sender: { $ne: userId }
        });

        // 4. Send both the conversations and the calculated count to the frontend.
        res.status(200).json({ 
            success: true, 
            data: {
                conversations: conversations,
                unreadCount: unreadCount
            }
        });
    } catch (error) {
        next(error);
    }
    });
