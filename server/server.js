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
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const apiRoutes = require('./routes/index');

const User = require('./model/user');
const Conversation = require('./model/conversationModel');
const Message = require('./model/messageModel');

dotenv.config();
connectDB();

const app = express();


app.use(express.json()); 
app.use(cookieParser());
app.use(helmet());
app.use(requestId()); 

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
        console.error('Error in sendMessage handler:', error);
    }
  });

  socket.on('disconnect', () => {
    if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// --- REAL-TIME NOTIFICATION UPGRADE: Export the socket map ---
module.exports = { userSocketMap };
// --- END UPGRADE ---