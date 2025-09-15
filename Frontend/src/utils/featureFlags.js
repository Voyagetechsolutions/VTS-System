// Simple feature toggles via env and localStorage overrides
const env = {
  voice_control: String(process.env.REACT_APP_FF_VOICE_CONTROL || 'true').toLowerCase() === 'true',
  offline_queue_v2: String(process.env.REACT_APP_FF_OFFLINE_QUEUE_V2 || 'true').toLowerCase() === 'true',
  logrocket: String(process.env.REACT_APP_LOGROCKET_ID || '').length > 0,
};

export function isEnabled(flag) {
  try {
    const override = localStorage.getItem(`ff_${flag}`);
    if (override === 'true') return true;
    if (override === 'false') return false;
  } catch {}
  return !!env[flag];
}

export function setFlag(flag, value) {
  try { localStorage.setItem(`ff_${flag}`, value ? 'true' : 'false'); } catch {}
}


