// server/models/Kudos.js
const mongoose = require('mongoose');

const kudosSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: {
      type: String,
      required: [true, 'Kudos message cannot be empty.'],
      trim: true,
      maxlength: [280, 'Kudos message cannot exceed 280 characters.'],
    },
    companyValue: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Kudos', kudosSchema);