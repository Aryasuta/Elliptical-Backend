const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('../config/db');
const serverless = require('serverless-http');

const userRoutes = require('../routes/userRoutes');
const sessionRoutes = require('../routes/sessionRoutes');
const scanRoutes = require('../routes/scanRoutes');

dotenv.config();
connectDB();

const app = express();
const path = require('path');

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

// Export handler for serverless
module.exports.handler = serverless(app);  // This is the serverless handler
