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

dotenv.config();
connectDB();

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

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  userSocketMap[userId] = socket.id;

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
  

  socket.on('sendMessage', async (messageData) => {
    try {
        const { conversationId, text } = messageData;
        const senderId = socket.user._id;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const recipientId = conversation.participants.find(p => p.toString() !== senderId.toString());
        if (!recipientId) return;

        const newMessage = new Message({ conversationId, sender: senderId, text });
        await newMessage.save();

        conversation.lastMessage = { text, sender: senderId, createdAt: new Date() };
        await conversation.save();

        const populatedMessage = await newMessage.populate('sender', 'name profilePictureUrl');
        const recipientSocketId = userSocketMap[recipientId.toString()];

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('newMessage', {
                conversationId,
                message: populatedMessage
            });
        }
        
    } catch (error) {
        logger.error('Error in sendMessage handler:', error);
    }
  });

  socket.on('disconnect', () => {
    if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
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