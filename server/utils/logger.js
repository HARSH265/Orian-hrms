const { createLogger, format, transports } = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'orion-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
        })
      )
    }),
    new transports.File({
      filename: path.join(logDir, 'server_error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new transports.File({
      filename: path.join(logDir, 'server.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

module.exports = logger;
