const validator = require('validator');

/**
 * Validates the raw (unmasked) form body before masking is applied.
 * Returns 422 with field-level errors if validation fails.
 */
function validateSubmission(req, res, next) {
  const { name, email, phone, nationalId, cardNumber } = req.body;
  const errors = {};

  // At least one field must be present
  if (!name && !email && !phone && !nationalId && !cardNumber) {
    return res.status(422).json({ error: 'At least one field is required.' });
  }

  if (name && typeof name !== 'string') {
    errors.name = 'Name must be a string.';
  }

  if (email) {
    if (!validator.isEmail(String(email))) {
      errors.email = 'Invalid email address.';
    }
  }

  if (phone) {
    // Allow digits, spaces, dashes, parentheses, leading +
    if (!/^\+?[\d\s\-().]{5,20}$/.test(String(phone))) {
      errors.phone = 'Invalid phone number.';
    }
  }

  if (nationalId && String(nationalId).length < 3) {
    errors.nationalId = 'ID too short to mask meaningfully.';
  }

  if (cardNumber) {
    const digits = String(cardNumber).replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      errors.cardNumber = 'Card number must be 13–19 digits.';
    }
    // Basic Luhn check
    if (!luhn(digits)) {
      errors.cardNumber = 'Card number failed Luhn check.';
    }
  }

  if (Object.keys(errors).length) {
    return res.status(422).json({ errors });
  }

  next();
}

/** Standard Luhn algorithm */
function luhn(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

module.exports = { validateSubmission };
