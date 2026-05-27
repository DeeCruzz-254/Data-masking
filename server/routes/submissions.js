const express = require('express');
const router = express.Router();
const { maskPayload } = require('../masking');
const { validateSubmission } = require('../middleware/validate');
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
    const { name, email, phone, nationalId, cardNumber } = req.body;

    // Apply all masks — raw values are used ONLY here and then discarded
    const masked = maskPayload({ name, email, phone, nationalId, cardNumber });

    // Persist only the masked payload
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
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

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
    const submission = await UserSubmission.findById(req.params.id).lean();
    if (!submission) return res.status(404).json({ error: 'Submission not found.' });
    res.json(submission);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID.' });
  }
});

/**
 * DELETE /api/submissions/:id
 * Removes a stored submission. Auth-protect in production.
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await UserSubmission.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Submission not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID.' });
  }
});

module.exports = router;
