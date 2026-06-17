const validator = require('validator');

/**
 * validate.js
 * Middleware validating raw (unmasked) submission payloads before masking.
 * Returns a 422 response with a map of field-level errors when validation fails.
 */
function validateSubmission(req, res, next) {
  const { name, email, phone, nationalId, cardNumber } = req.body;
  const errors = {};

  // At least one field must be present — avoid empty submissions
  if (!name && !email && !phone && !nationalId && !cardNumber) {
    return res.status(422).json({ error: 'At least one field is required.' });
  }

  // Name: if present, must be a string
  if (name && typeof name !== 'string') {
    errors.name = 'Name must be a string.';
  }

  // Email: use validator to check format
  if (email) {
    if (!validator.isEmail(String(email))) {
      errors.email = 'Invalid email address.';
    }
  }

  // Phone: permissive pattern allowing common separators and a leading +
  if (phone) {
    // Allow digits, spaces, dashes, parentheses, leading +
    if (!/^\+?[\d\s\-().]{5,20}$/.test(String(phone))) {
      errors.phone = 'Invalid phone number.';
    }
  }

  // National ID: require a minimally sensible length to allow masking
  if (nationalId && String(nationalId).length < 3) {
    errors.nationalId = 'ID too short to mask meaningfully.';
  }

  // Card number: normalize to digits, check reasonable length and Luhn
  if (cardNumber) {
    const digits = String(cardNumber).replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) {
      errors.cardNumber = 'Card number must be 13–19 digits.';
    }
    // Basic Luhn check for likely valid card numbers
    if (!luhn(digits)) {
      errors.cardNumber = 'Card number failed Luhn check.';
    }
  }

  // If any validation errors, return them to the client
  if (Object.keys(errors).length) {
    return res.status(422).json({ errors });
  }

  // Otherwise move to next middleware (masking & persistence)
  next();
}

/**
 * Standard Luhn algorithm used to sanity check card numbers.
 * Operates on a string of digits.
 */
function luhn(digits) {
  let sum = 0;
  let alt = false; // alternate doubling flag
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9; // sum of digits for doubled value
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

module.exports = { validateSubmission };
