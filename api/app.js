const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/db');
const UserModel = require('./models/User');
const SessionModel = require('./models/Session');
const { clearActiveCard, getActiveCardId } = require('./controllers/scanController');

dotenv.config();
connectDB();

const app = express();

// Enable CORS for frontend access
app.use(cors({
  origin: 'https://sehat.teluapp.org',  // Pastikan frontend diizinkan
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parser Middleware
app.use(bodyParser.json());

// Routes
app.post('/scan/card', async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'Card ID is required' });

  try {
    // Simulate reading cardId from RFID
    console.log('Card detected:', cardId);
    res.json({ cardId });  // Return cardId as JSON response
  } catch (err) {
    console.error('Error scanning card:', err);
    res.status(500).json({ message: 'Error scanning card' });
  }
});

// Start Session
app.post('/sessions/start', async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('./config/db').getDB();
    const [existingSessions] = await db.query(
      'SELECT * FROM sessions WHERE userId = ? AND endTime IS NULL',
      [user.id]
    );

    if (existingSessions.length > 0) {
      return res.status(400).json({
        message: 'Sesi sebelumnya belum selesai.',
        sessionId: existingSessions[0].id,
        startTime: existingSessions[0].startTime
      });
    }

    const dateNow = new Date();
    const sessionId = await SessionModel.createSession(user.id, dateNow);

    return res.status(201).json({
      message: 'Session started',
      sessionId,
      startTime: dateNow
    });
  } catch (err) {
    console.error('Error starting session:', err);
    return res.status(500).json({ message: 'Error starting session' });
  }
});

// End Session
app.post('/sessions/end', async (req, res) => {
  const { cardId, tickCount } = req.body;

  if (!cardId || tickCount === undefined) {
    return res.status(400).json({ message: 'cardId and tickCount are required' });
  }

  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('./config/db').getDB();
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE userId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1',
      [user.id]
    );

    const session = sessions[0];
    if (!session) return res.status(404).json({ message: 'No active session found' });

    const endTime = new Date();
    const durationMs = endTime - new Date(session.startTime);
    const durationHours = durationMs / (1000 * 60 * 60);

    const distance = (tickCount * 1.56).toFixed(1);  // 1.56 meter per tick
    const weight = user.weight || 60;
    const calories = (6.8 * weight * durationHours).toFixed(1); // MET formula
    const avgSpeed = ((distance / durationMs) * 1000 * 3.6).toFixed(1); // speed in km/h

    await SessionModel.endSession(session.id, endTime, 'done', tickCount, distance, calories, avgSpeed);

    clearActiveCard();

    return res.status(200).json({
      message: 'Session ended',
      sessionId: session.id,
      tickCount,
      distance,
      calories,
      avgSpeed,
      startTime: session.startTime,
      endTime
    });
  } catch (err) {
    console.error('Error ending session:', err);
    return res.status(500).json({ message: 'Error ending session' });
  }
});

// Check User Existence
app.post('/sessions/check-user', async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: 'cardId is required' });

  try {
    const user = await UserModel.findUserByCardId(cardId);
    return res.json({ userExists: !!user });
  } catch (err) {
    console.error('Error checking user existence:', err);
    return res.status(500).json({ message: 'Error checking user existence' });
  }
});

// Handle session history
app.get('/sessions/:cardId', async (req, res) => {
  const { cardId } = req.params;
  try {
    const user = await UserModel.findUserByCardId(cardId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const db = require('./config/db').getDB();
    const [sessions] = await db.query('SELECT * FROM sessions WHERE userId = ? ORDER BY startTime DESC', [user.id]);
    res.json({ cardId, sessions });
  } catch (err) {
    console.error('Error fetching session history:', err);
    res.status(500).json({ message: 'Error fetching session history' });
  }
});

// Start server
const PORT = process.env.PORT || 3210;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
