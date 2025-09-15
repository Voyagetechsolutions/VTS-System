export function requireString(value, fieldName, { min = 1, max = 255 } = {}) {
  const v = String(value || '').trim();
  if (v.length < min) throw new Error(`${fieldName} is required`);
  if (v.length > max) throw new Error(`${fieldName} is too long`);
  return v;
}

export function requireEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new Error('A valid email is required');
  return email;
}

export function optionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${fieldName} must be a number`);
  return n;
}

export function sanitizeText(value) {
  return String(value || '').replace(/[<>]/g, '');
}


