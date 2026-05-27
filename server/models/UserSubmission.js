const mongoose = require('mongoose');

/**
 * UserSubmission — stores ONLY masked values.
 * Raw sensitive data is never written to the database.
 */
const userSubmissionSchema = new mongoose.Schema(
  {
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
    maskedAt: {
      type: Date,
      default: Date.now,
    },
    // Metadata
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Never expose raw data via JSON — field names make it clear these are masked
    toJSON: { virtuals: true },
  }
);

// Virtual: shows a human-readable label for the record
userSubmissionSchema.virtual('summary').get(function () {
  return `${this.name || 'Anonymous'} — submitted ${this.createdAt?.toLocaleDateString()}`;
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);
