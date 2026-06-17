/**
 * Server entrypoint
 * - Loads environment variables
 * - Configures Express app with minimal security + parsing middleware
 * - Mounts API routes and a lightweight in-memory rate limiter
 * - Connects to MongoDB and starts the HTTP server
 */
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');

// Router that handles submission CRUD
const submissionsRouter = require('./routes/submissions');

// Create the Express app and determine listen port
const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
// CORS: allow only configured client (default localhost:3000)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsers: accept JSON and urlencoded form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate-limit guard (no extra package required)
// Lightweight in-memory rate limiter
// Note: For production use a distributed store (Redis) or a battle-tested middleware
const requestCounts = new Map();
app.use((req, res, next) => {
  const key = req.ip;                 // use client IP as the bucket key
  const now = Date.now();
  const window = 60_000; // 1 minute window for rate counting
  const limit  = 30;      // max allowed requests per window

  // Initialize bucket if missing
  if (!requestCounts.has(key)) requestCounts.set(key, []);

  // Keep only timestamps within the window
  const timestamps = requestCounts.get(key).filter(t => now - t < window);

  // Record this request
  timestamps.push(now);
  requestCounts.set(key, timestamps);

  // If over the limit, block with 429
  if (timestamps.length > limit) {
    return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
  }

  // Otherwise continue to next middleware/route
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
// Mount API routes related to submissions
app.use('/api/submissions', submissionsRouter);

// Health check endpoint for uptime and DB status monitoring
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV,
  });
});

// 404 fallback
// 404 fallback handler for unmatched routes
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
// Global error handler — ensures server doesn't leak stack traces to clients
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Database + start ────────────────────────────────────────────────────────
// Connect to MongoDB and start the HTTP server
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/data_masking', {
      serverSelectionTimeoutMS: 5000, // fail fast if DB unreachable
    });
    console.log('✅  MongoDB connected');

    // Start listening once DB is connected
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  } catch (err) {
    // Log error and exit — failing early avoids serving a broken app
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

start();
