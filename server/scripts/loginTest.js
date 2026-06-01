require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../model/user');
const generateTokens = require('../utils/generateToken');

(async () => {
  await connectDB();
  const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
  if (!user) { console.error('User not found'); process.exit(1); }
  const isMatch = await user.matchPassword('Password123!');
  console.log('Password match?', isMatch);
  if (!isMatch) { console.error('Password mismatch'); process.exit(1); }
  const dummyRes = { cookie: () => {} }; const { accessToken } = await generateTokens(dummyRes, user._id, user.systemRole);
  console.log('Token:', accessToken);
  process.exit(0);
})();
