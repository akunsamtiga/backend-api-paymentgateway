// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }

      req.user = decoded; 
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }
  };
};

module.exports = auth;
