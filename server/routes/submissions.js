/**
 * /routes/submissions.js
 * Routes to accept raw form submissions, mask sensitive fields server-side,
 * persist only masked values, and expose retrieval endpoints for masked records.
 * IMPORTANT: raw sensitive values must never be stored or returned.
 */
const express = require('express');
const router = express.Router();

// Masking utility (server-side)
const { maskPayload } = require('../masking');

// Request validation middleware (validates raw input before masking)
const { validateSubmission } = require('../middleware/validate');

// Mongoose model storing masked data only
const UserSubmission = require('../models/UserSubmission');

/**
 * POST /api/submissions
 * Accepts raw form data, masks it server-side, persists masked values only.
 *
 * Body: { name, email, phone, nationalId, cardNumber }
 * Returns: { message, masked, id }
 */
router.post('/', validateSubmission, async (req, res) => {
  try {
    // Destructure raw fields from client request
    const { name, email, phone, nationalId, cardNumber } = req.body;

    // Apply all masks — raw values are used ONLY here and then discarded
    const masked = maskPayload({ name, email, phone, nationalId, cardNumber });

    // Persist only the masked payload and some lightweight metadata
    const submission = await UserSubmission.create({
      ...masked,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Raw values are NEVER included in the response
    res.status(201).json({
      message: 'Submission saved. Raw values were never stored.',
      masked,
      id: submission._id,
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Server error during submission.' });
  }
});

/**
 * GET /api/submissions
 * Returns all stored (masked) submissions.
 * In production, protect this route with authentication.
 */
router.get('/', async (req, res) => {
  try {
    // Simple pagination with sane defaults and hard cap on page size
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    // Parallelize fetch + count for efficiency
    const [submissions, total] = await Promise.all([
      UserSubmission.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserSubmission.countDocuments(),
    ]);

    res.json({
      submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error fetching submissions.' });
  }
});

/**
 * GET /api/submissions/:id
 * Returns a single masked submission by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    // Return a single masked submission by its document id
    const submission = await UserSubmission.findById(req.params.id).lean();
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    res.json(submission);
  } catch (err) {
    // Could be a malformed ObjectId
    res.status(400).json({ error: 'Invalid ID.' });
  }
});

/**
 * DELETE /api/submissions/:id
 * Removes a stored submission. Auth-protect in production.
 */
router.delete('/:id', async (req, res) => {
  try {
    // Delete a stored submission (note: protect this in production)
    const result = await UserSubmission.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Submission not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID.' });
  }
});

module.exports = router;
