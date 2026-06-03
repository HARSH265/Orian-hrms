// In: server/server.js

const express = require('express');
const helmet = require('helmet');
const requestId = require('express-request-id');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { createAdapter } = require('@socket.io/redis-adapter');
const { Redis } = require('ioredis');
const { connectDB, gracefulShutdown } = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const apiRoutes = require('./routes/index');
const logger = require('./utils/logger');

const User = require('./model/user');
const Conversation = require('./model/conversationModel');
const Message = require('./model/messageModel');
const { isBlacklisted } = require('./utils/tokenBlacklist');
const { setIO } = require('./services/notificationService');
const { getFeatures } = require('./middleware/featureToggle');

dotenv.config();
connectDB();

const { startRecurringExpenseJob } = require('./scripts/recurringExpensesJob');
const { startRecurringTaskJob } = require('./scripts/recurringTasksJob');
const { startTaskSLAJob } = require('./scripts/taskSLAJob');
const { startAssetMaintenanceJob } = require('./scripts/assetMaintenanceJob');
const { startAssetWarrantyJob } = require('./scripts/assetWarrantyJob');
const { startReviewScheduleJob } = require('./scripts/reviewScheduleJob');
const { startReviewReminderJob } = require('./scripts/reviewReminderJob');
const { startDocumentExpiryJob } = require('./scripts/documentExpiryJob');
const { startDocumentAckJob } = require('./scripts/documentAckJob');
const { startLeaveBalanceJob } = require('./scripts/leaveBalanceJob');
startRecurringExpenseJob();
startRecurringTaskJob();
startTaskSLAJob();
startAssetMaintenanceJob();
startAssetWarrantyJob();
startReviewScheduleJob();
startReviewReminderJob();
startDocumentExpiryJob();
startDocumentAckJob();
startLeaveBalanceJob();

const app = express();
app.set('trust proxy', 1);

app.use(express.json()); 
app.use(cookieParser());
app.use(helmet());
app.use(requestId());
app.use(require('./middleware/requestLogger')) 

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
    credentials: true, 
};

app.use(cors(corsOptions)); 

app.use('/api', apiRoutes);

app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const configureRedisAdapter = async () => {
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter configured.');
    } catch (err) {
      console.warn('Redis adapter not available, using in-memory adapter:', err.message);
    }
  }
};
configureRedisAdapter();

// --- REAL-TIME NOTIFICATION UPGRADE: Make `io` globally accessible ---
app.set('io', io);
setIO(io);
// --- END UPGRADE ---

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token'));
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Token is invalid'));
  }
});

const userSocketMap = {};

io.on('connection', async (socket) => {
  const userId = socket.user._id.toString();
  const existingSocketId = userSocketMap[userId];
  userSocketMap[userId] = socket.id;

  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

  socket.join(userId);
  socket.broadcast.emit('userOnline', { userId });

  socket.use(async (packet, next) => {
    const [event] = packet;
    if (event === 'disconnect') return next();

    try {
      const decoded = jwt.verify(socket.handshake.auth.token, process.env.JWT_ACCESS_SECRET);
      if (isBlacklisted(decoded.jti)) {
        socket.emit('auth-error', { message: 'Token has been revoked' });
        socket.disconnect(true);
        return;
      }
      next();
    } catch {
      socket.emit('auth-error', { message: 'Token is invalid or expired' });
      socket.disconnect(true);
    }
  });

  socket.on('sendMessage', async (messageData, ack) => {
    try {
        const features = await getFeatures();
        if (!features.chatEnabled) {
            if (ack) ack({ error: 'Chat is disabled by administrator.' });
            return;
        }
        const { conversationId, text, attachments, parentMessageId } = messageData;
        const senderId = socket.user._id;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            if (ack) ack({ error: 'Conversation not found' });
            return;
        }

        const recipientIds = conversation.participants.filter(p => p.toString() !== senderId.toString()).map(p => p.toString());

        let messageType = 'text';
        if (attachments && attachments.length > 0) {
            messageType = attachments.some(a => a.mimeType && a.mimeType.startsWith('image/')) ? 'image' : 'file';
        }

        const messageDataToSave = { conversationId, sender: senderId, text, messageType };
        if (attachments && attachments.length > 0) messageDataToSave.attachments = attachments;
        if (parentMessageId) messageDataToSave.parentMessage = parentMessageId;

        const newMessage = await Message.create(messageDataToSave);

        const lastMessageUpdate = {
            text,
            sender: senderId,
            createdAt: new Date(),
            messageType,
        };
        if (attachments && attachments.length > 0) {
            lastMessageUpdate.attachments = attachments.map(a => ({
                fileUrl: a.fileUrl,
                fileName: a.fileName,
                mimeType: a.mimeType,
            }));
        }
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: lastMessageUpdate });

        const populatedMessage = await newMessage.populate('sender', 'name profilePictureUrl');

        for (const rId of recipientIds) {
            const sockId = userSocketMap[rId];
            if (sockId) {
                io.to(sockId).emit('newMessage', { conversationId, message: populatedMessage });
            }
        }

        await Message.findByIdAndUpdate(newMessage._id, { deliveredAt: new Date() });

        if (ack) ack({ success: true, message: populatedMessage.toObject() });
    } catch (error) {
        logger.error('Error in sendMessage handler:', error);
        if (ack) ack({ error: 'Failed to send message' });
    }
  });

  socket.on('typing', async (data) => {
    const features = await getFeatures();
    if (!features.chatEnabled) return;
    const { conversationId } = data;
    socket.to(conversationId).emit('typing', { conversationId, userId, name: socket.user.name });
  });

  socket.on('stopTyping', async (data) => {
    const features = await getFeatures();
    if (!features.chatEnabled) return;
    const { conversationId } = data;
    socket.to(conversationId).emit('stopTyping', { conversationId, userId });
  });

  socket.on('markRead', async (data) => {
    try {
      const features = await getFeatures();
      if (!features.chatEnabled) return;
      const { conversationId, messageIds } = data;
      const now = new Date();
      await Message.updateMany(
        { _id: { $in: messageIds }, sender: { $ne: userId } },
        { $set: { isRead: true }, $push: { readBy: { user: userId, readAt: now } } }
      );

      const recipientIds = (await Conversation.findById(conversationId)).participants
        .filter(p => p.toString() !== userId)
        .map(p => p.toString());

      for (const rId of recipientIds) {
        const sockId = userSocketMap[rId];
        if (sockId) {
          io.to(sockId).emit('messagesRead', { conversationId, messageIds, readBy: userId, readAt: now });
        }
      }
    } catch (error) {
      logger.error('Error in markRead handler:', error);
    }
  });

  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('disconnect', async () => {
    if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
    }

    const userStillConnected = Object.keys(userSocketMap).some(id => id === userId);
    if (!userStillConnected) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit('userOffline', { userId, lastSeen: new Date() });
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason.message || reason);
});

// --- REAL-TIME NOTIFICATION UPGRADE: Export the socket map ---
module.exports = { userSocketMap };
// --- END UPGRADE ---