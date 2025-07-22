const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../config/db');

const userRoutes = require('../routes/userRoutes');
const sessionRoutes = require('../routes/sessionRoutes');
const scanRoutes = require('../routes/scanRoutes');

dotenv.config();
connectDB();

const app = express();

// ✅ Serving static files (HTML, CSS, JS)
app.use(express.static('public'));  // ✅ Tambahkan ini

app.use(express.json());

app.use((req, res, next) => {
  console.log(`\n===== [${new Date().toISOString()}] ${req.method} ${req.originalUrl} =====`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('No body.');
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.get("/", (_, res) => res.send("API is running..."));

// POST endpoint untuk menerima data dari frontend
app.post('/users', async (req, res) => {
  const { cardId, name, weight, gender } = req.body;

  // Validasi data yang diperlukan
  if (!cardId || !name || !weight || !gender) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Logika untuk menyimpan data pengguna
    const newUser = {
      cardId,
      name,
      weight,
      gender
    };

    // Anda bisa menggantinya dengan logika penyimpanan ke database
    // Misalnya, UserModel.createUser(newUser);
    
    console.log('New User Registered:', newUser);

    return res.status(201).json({
      message: 'User created successfully',
      newUser
    });
  } catch (err) {
    console.error('Error during user creation:', err);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/scan', scanRoutes);

const PORT = process.env.PORT || 3000;
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
// });

module.exports = app;
