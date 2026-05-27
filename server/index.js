require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');

const submissionsRouter = require('./routes/submissions');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate-limit guard (no extra package required)
const requestCounts = new Map();
app.use((req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const window = 60_000; // 1 minute
  const limit  = 30;

  if (!requestCounts.has(key)) requestCounts.set(key, []);
  const timestamps = requestCounts.get(key).filter(t => now - t < window);
  timestamps.push(now);
  requestCounts.set(key, timestamps);

  if (timestamps.length > limit) {
    return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  }
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/submissions', submissionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
  });
});

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Database + start ────────────────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/data_masking', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

start();
