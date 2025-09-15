const actionTimestamps = new Map();

export function canPerform(key, intervalMs = 1000) {
  const now = Date.now();
  const last = actionTimestamps.get(key) || 0;
  if (now - last < intervalMs) return false;
  actionTimestamps.set(key, now);
  return true;
}

export function withRateLimit(key, intervalMs, fn) {
  return async (...args) => {
    if (!canPerform(key, intervalMs)) return;
    return fn(...args);
  };
}

