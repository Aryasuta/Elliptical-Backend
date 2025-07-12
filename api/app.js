const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require(__dirname + '/../config/db');

const userRoutes = require(__dirname + '/../routes/userRoutes');
const sessionRoutes = require(__dirname + '/../routes/sessionRoutes');
const scanRoutes = require(__dirname + '/../routes/scanRoutes');

dotenv.config();
connectDB();

const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/users', userRoutes);
app.use('/sessions', sessionRoutes);
app.use('/scan', scanRoutes);
app.get('/', (_, res) => res.send('API is running...'));

// ✅ Jangan pakai app.listen() di Vercel!
// module.exports = app;

const serverless = require('serverless-http');
module.exports.handler = serverless(app); // ✅ export sesuai dengan Vercel requirement
