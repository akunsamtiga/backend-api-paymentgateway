// utils/logger.js
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/%DATE%-transactions.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,         
      maxSize: '20m',              
      maxFiles: '14d',             
      level: 'info'              
    })
  ]
});

module.exports = logger;
