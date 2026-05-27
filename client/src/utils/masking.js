/**
 * utils/masking.js
 * Client-side masking — runs on every keystroke so the user sees masked output
 * in real time. Mirrors server/masking.js exactly so behaviour is consistent.
 */

export function maskRange(str, start, end = -1, char = '*') {
  const s = String(str);
  const e = end === -1 ? s.length : end;
  return s.slice(0, start) + char.repeat(Math.max(0, e - start)) + s.slice(e);
}

export function maskEmail(email) {
  if (!email) return '';
  const atIdx = email.indexOf('@');
  if (atIdx === -1) return maskRange(email, Math.min(2, email.length));
  const local  = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  const maskedLocal = maskRange(local, Math.min(2, local.length));
  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx <= 0) return `${maskedLocal}@${maskRange(domain, Math.min(1, domain.length))}`;
  const host = domain.slice(0, dotIdx);
  const tld  = domain.slice(dotIdx);
  return `${maskedLocal}@${maskRange(host, Math.min(1, host.length))}${tld}`;
}

export function maskPhone(phone) {
  if (!phone) return '';
  return phone.slice(0, 2) + phone.slice(2).replace(/\d/g, '*');
}

export function maskID(id) {
  if (!id) return '';
  return maskRange(id, Math.min(2, id.length));
}

export function maskCard(card) {
  if (!card) return '';
  const digits = card.replace(/\D/g, '');
  if (!digits.length) return '';
  const masked = '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
  return (masked.match(/.{1,4}/g) || []).join(' ');
}

/** Format card input as user types — groups digits into blocks of 4 */
export function formatCardInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return (digits.match(/.{1,4}/g) || []).join(' ');
}
