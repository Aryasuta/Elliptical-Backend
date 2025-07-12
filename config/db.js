const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool;

const connectDB = async () => {
  // Memeriksa apakah pool sudah ada untuk menghindari pembuatan koneksi baru setiap request
  if (pool) {
    console.log('✅ Reusing MySQL Pool');
    return pool;
  }

  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ MySQL Connected!');
    return pool;
  } catch (err) {
    console.error('❌ MySQL Connection Error:', err);
    process.exit(1);  // Menghentikan aplikasi jika koneksi gagal
  }
};

const getDB = () => pool;

module.exports = { connectDB, getDB };
