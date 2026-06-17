const mongoose = require('mongoose');

/**
 * UserSubmission schema — stores ONLY masked values.
 * Raw sensitive data must never be persisted.
 */
const userSubmissionSchema = new mongoose.Schema(
  {
    // Optional name (not masked by design); trimmed and size-limited
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name must be under 100 characters'],
    },
    // All fields below store masked strings only
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    nationalId: {
      type: String,
      trim: true,
    },
    cardNumber: {
      type: String,
      trim: true,
    },
    // Timestamp when the server applied masking
    maskedAt: {
      type: Date,
      default: Date.now,
    },
    // Lightweight metadata (not considered sensitive here)
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Keep virtuals when converting to JSON for convenience
    toJSON: { virtuals: true },
  }
);

// Virtual: human-readable summary useful for admins/debugging UIs
userSubmissionSchema.virtual('summary').get(function () {
  return `${this.name || 'Anonymous'} — submitted ${this.createdAt?.toLocaleDateString()}`;
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);
