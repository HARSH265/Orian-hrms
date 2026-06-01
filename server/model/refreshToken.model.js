// Refresh Token Model – stores hashed refresh tokens for revocation & rotation
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true }, // bcrypt hash of the JWT refresh token
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
}, { timestamps: true });

// Helper to compare a plain token with the stored hash
RefreshTokenSchema.methods.isValid = async function (plainToken) {
  return await bcrypt.compare(plainToken, this.tokenHash);
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
