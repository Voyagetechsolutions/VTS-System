// Minimal offline queue with idempotency keys
import { isEnabled } from './featureFlags';
const KEY = 'vts_offline_queue';

function readQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(KEY, JSON.stringify(q.slice(0, 500))); } catch {}
}

export function enqueue(action) {
  const q = readQueue();
  const id = action.id || `${action.type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const item = { id, ...action, ts: Date.now() };
  // Avoid duplicates by idempotency key
  if (!q.find(x => x.id === item.id)) q.push(item);
  writeQueue(q);
  return item.id;
}

export async function flushQueue(handlers) {
  const q = readQueue();
  const remain = [];
  for (const item of q) {
    const h = handlers[item.type];
    if (!h) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      const payload = isEnabled('offline_queue_v2') ? { ...item.payload, idempotencyKey: item.id } : item.payload;
      await h(payload);
    } catch {
      remain.push(item);
    }
  }
  writeQueue(remain);
}

export function getQueueLength() {
  return readQueue().length;
}

let intervalId;
export function startBackgroundSync(handlers, ms = 60 * 1000) {
  stopBackgroundSync();
  intervalId = setInterval(() => {
    flushQueue(handlers);
  }, ms);
}
export function stopBackgroundSync() {
  try { if (intervalId) clearInterval(intervalId); } catch {}
}


