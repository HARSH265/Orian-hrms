const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  isGroup: { type: Boolean, default: false },
  groupName: String,
  groupAvatar: String,
  groupDescription: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: Date,
    messageType: { type: String, default: 'text' },
    attachments: [{
      fileUrl: String,
      fileName: String,
      mimeType: String,
    }],
  },
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.createdAt': -1 });

module.exports = mongoose.model('Conversation', conversationSchema);