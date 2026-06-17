/**
 * masking.js
 * Core data-masking utilities used before persistence.
 * Mirror these functions in the React client (utils/masking.js) to maintain
 * consistent masking behaviour between client and server.
 *
 * Masking rules summary:
 * - Email   : keep first 2 chars of local part + first char of domain host; mask the rest
 * - Phone   : keep first 2 chars; mask all remaining digits
 * - ID/SSN  : keep first 2 chars; mask the rest
 * - Card    : keep last 4 digits (PCI-DSS); mask everything before
 * - Name    : not masked (display only)
 */

/**
 * Replace characters in a string with a mask character.
 * @param {string} str
 * @param {number} start   - index to start masking (inclusive)
 * @param {number} end     - index to stop masking (exclusive), -1 = to end
 * @param {string} [char]  - mask character, default '*'
 */
function maskRange(str, start, end, char = '*') {
  // Ensure we work with a string
  const s = String(str);

  // Treat -1 as 'to the end of string'
  const e = end === -1 ? s.length : end;

  // Keep prefix up to `start`, replace [start, e) with mask chars, then append suffix
  return s.slice(0, start) + char.repeat(Math.max(0, e - start)) + s.slice(e);
}

/**
 * Mask an email address.
 * ja**@e******.com  ← jane@example.com
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';

  // Locate the @ symbol — if missing, apply a safe fallback mask
  const atIdx = email.indexOf('@');
  if (atIdx === -1) {
    // No @ present: mask everything after first two characters
    return maskRange(email, Math.min(2, email.length), -1);
  }

  // Split local part and domain
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1); // e.g. "example.com"

  // Mask local part after first two characters
  const maskedLocal = maskRange(local, Math.min(2, local.length), -1);

  // Try to split host and tld (last dot). If domain malformed, mask conservatively
  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx <= 0) {
    // Malformed domain — mask everything after the first character of domain
    return maskedLocal + '@' + maskRange(domain, Math.min(1, domain.length), -1);
  }

  // Host is domain before last dot; keep one char then mask remainder
  const host = domain.slice(0, dotIdx);   // "example"
  const tld  = domain.slice(dotIdx);      // ".com"
  const maskedHost = maskRange(host, Math.min(1, host.length), -1);

  return `${maskedLocal}@${maskedHost}${tld}`;
}

/**
 * Mask a phone number — keeps first 2 characters, masks all subsequent digits.
 * +2**********  ← +254712345678
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';

  // Keep prefix (country code or first two chars) and mask the rest of the digits
  const keep = phone.slice(0, 2);
  const rest = phone.slice(2).replace(/\d/g, '*');
  return keep + rest;
}

/**
 * Mask a national ID / SSN — keeps first 2 chars, masks the rest.
 * 12******  ← 12345678
 */
function maskID(id) {
  if (!id || typeof id !== 'string') return '';
  // Keep first two characters (if present) — rest masked
  return maskRange(id, Math.min(2, id.length), -1);
}

/**
 * Mask a payment card number — keeps last 4 digits, groups into blocks of 4.
 * **** **** **** 1111  ← 4111111111111111
 */
function maskCard(card) {
  if (!card || typeof card !== 'string') return '';

  // Strip non-digit characters to work with card digits only
  const digits = card.replace(/\D/g, '');
  if (!digits.length) return '';

  // PCI-friendly: reveal only the last 4 digits
  const last4   = digits.slice(-4);
  const masked  = '*'.repeat(Math.max(0, digits.length - 4)) + last4;

  // Group into 4-digit blocks for readability
  return masked.match(/.{1,4}/g).join(' ');
}

/**
 * Apply all masks to a raw form payload.
 * Returns a new object — never mutates the input.
 *
 * @param {{ name, email, phone, nationalId, cardNumber }} raw
 * @returns {{ name, email, phone, nationalId, cardNumber, maskedAt }}
 */
function maskPayload(raw) {
  // Return a new object containing masked fields (do not mutate input)
  return {
    name:       raw.name       || '',           // not masked by design
    email:      maskEmail(raw.email),
    phone:      maskPhone(raw.phone),
    nationalId: maskID(raw.nationalId),
    cardNumber: maskCard(raw.cardNumber),
    maskedAt:   new Date().toISOString(), // timestamp when masking occurred
  };
}

module.exports = { maskEmail, maskPhone, maskID, maskCard, maskPayload, maskRange };
