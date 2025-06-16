// utils/logger.js
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');

// Buat folder log jika belum ada
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
      zippedArchive: true,         // ✅ Kompres file log lama (.gz)
      maxSize: '20m',              // ✅ Maksimal ukuran file sebelum rotasi
      maxFiles: '14d',             // ✅ Simpan log selama 14 hari
      level: 'info'                // ✅ Level default: info
    })
  ]
});

module.exports = logger;
