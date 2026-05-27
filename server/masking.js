/**
 * masking.js
 * Core data-masking utilities.
 * Used server-side before persistence; mirror these in the React client (utils/masking.js).
 *
 * Rules
 *  - Email   : keep first 2 chars of local part + first char of domain host; mask the rest
 *  - Phone   : keep first 2 chars; mask all remaining digits
 *  - ID/SSN  : keep first 2 chars; mask the rest
 *  - Card    : keep last 4 digits (PCI-DSS); mask everything before
 *  - Name    : not masked (display field)
 */

/**
 * Replace characters in a string with a mask character.
 * @param {string} str
 * @param {number} start   - index to start masking (inclusive)
 * @param {number} end     - index to stop masking (exclusive), -1 = to end
 * @param {string} [char]  - mask character, default '*'
 */
function maskRange(str, start, end, char = '*') {
  const s = String(str);
  const e = end === -1 ? s.length : end;
  return s.slice(0, start) + char.repeat(Math.max(0, e - start)) + s.slice(e);
}

/**
 * Mask an email address.
 * ja**@e******.com  ← jane@example.com
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';

  const atIdx = email.indexOf('@');
  if (atIdx === -1) {
    // No @ yet — mask after first two chars
    return maskRange(email, Math.min(2, email.length), -1);
  }

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1); // e.g. "example.com"

  const maskedLocal = maskRange(local, Math.min(2, local.length), -1);

  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx <= 0) {
    // Malformed domain — mask everything after first char
    return maskedLocal + '@' + maskRange(domain, Math.min(1, domain.length), -1);
  }

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
  return maskRange(id, Math.min(2, id.length), -1);
}

/**
 * Mask a payment card number — keeps last 4 digits, groups into blocks of 4.
 * **** **** **** 1111  ← 4111111111111111
 */
function maskCard(card) {
  if (!card || typeof card !== 'string') return '';
  const digits = card.replace(/\D/g, '');
  if (!digits.length) return '';
  const last4   = digits.slice(-4);
  const masked  = '*'.repeat(Math.max(0, digits.length - 4)) + last4;
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
  return {
    name:       raw.name       || '',           // not masked
    email:      maskEmail(raw.email),
    phone:      maskPhone(raw.phone),
    nationalId: maskID(raw.nationalId),
    cardNumber: maskCard(raw.cardNumber),
    maskedAt:   new Date().toISOString(),
  };
}

module.exports = { maskEmail, maskPhone, maskID, maskCard, maskPayload, maskRange };
