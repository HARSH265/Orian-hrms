require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../model/user');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');

(async () => {
  await connectDB();
  const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
  if (!user) { logger.error('User not found'); process.exit(1); }
  const isMatch = await user.matchPassword('Password123!');
  logger.info('Password match?', isMatch);
  if (!isMatch) { logger.error('Password mismatch'); process.exit(1); }
  const dummyRes = { cookie: () => {} }; const { accessToken } = await generateTokens(dummyRes, user._id, user.systemRole);
  logger.info('Token:', accessToken);
  process.exit(0);
})();
