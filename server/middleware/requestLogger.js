const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  // Attach a child logger with request ID (if present) and user ID (if known)
  const meta = {};
  if (req.id) meta.requestId = req.id;
  if (req.user && req.user._id) meta.userId = req.user._id.toString();
  req.logger = logger.child(meta);
  next();
};
