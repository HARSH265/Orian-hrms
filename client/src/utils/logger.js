// In: client/src/utils/logger.js

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = LOG_LEVELS[process.env.REACT_APP_LOG_LEVEL] || LOG_LEVELS.info;

const logger = {
  debug: (...args) => { if (currentLevel <= LOG_LEVELS.debug) console.debug('[DEBUG]', ...args); },
  info: (...args) => { if (currentLevel <= LOG_LEVELS.info) console.info('[INFO]', ...args); },
  warn: (...args) => { if (currentLevel <= LOG_LEVELS.warn) console.warn('[WARN]', ...args); },
  error: (...args) => { if (currentLevel <= LOG_LEVELS.error) console.error('[ERROR]', ...args); },
};

export default logger;
