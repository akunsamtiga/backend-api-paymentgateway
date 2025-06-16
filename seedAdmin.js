// seedAdmin.js
require('dotenv').config(); // ✅ Load .env

const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('./utils/hash');

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI tidak ditemukan di .env');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashed = await hashPassword('admin123');

    const existingAdmin = await User.findOne({ email: 'admin@sanzy.com' });
    if (existingAdmin) {
      console.log('ℹ️ Admin sudah ada. Tidak membuat ulang.');
    } else {
      await User.create({
        email: 'admin@sanzy.com',
        password: hashed,
        role: 'admin',
      });
      console.log('✅ Admin user berhasil dibuat');
    }

  } catch (err) {
    console.error('❌ Error membuat admin:', err.message);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
})();
