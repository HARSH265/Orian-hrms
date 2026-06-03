const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text',
  },
  attachments: [{
    fileUrl: { type: String },
    publicId: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
  deliveredAt: Date,
  editedAt: Date,
  deleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    emoji: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  }],
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
},

 { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, sender: 1, isRead: 1 });
messageSchema.index({ text: 'text' });

module.exports = mongoose.model('Message', messageSchema);
