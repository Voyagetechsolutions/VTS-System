// Lightweight SignalR client wrapper
// Requires @microsoft/signalr at runtime. If not present, dynamically import will fail gracefully.

let hub = null;
let conn = null;

export async function connectBusHub(baseUrl = '') {
  if (hub) return hub;
  try {
    const signalR = await import('@microsoft/signalr');
    const url = `${baseUrl || ''}/busTrackingHub`;
    conn = new signalR.HubConnectionBuilder()
      .withUrl(url, { withCredentials: true })
      .withAutomaticReconnect()
      .build();
    await conn.start();
    hub = conn;
    // Join company group if available
    try {
      if (typeof window !== 'undefined' && window.companyId) {
        await hub.invoke('JoinCompanyGroup', String(window.companyId));
      }
    } catch {}
    return hub;
  } catch (e) {
    console.error('SignalR connection failed', e);
    return null;
  }
}

export function on(event, handler) {
  if (!conn) return () => {};
  conn.on(event, handler);
  return () => {
    try { conn.off(event, handler); } catch {}
  };
}

export function getHub() { return hub; }

export async function disconnectBusHub() {
  try {
    if (hub) {
      try {
        if (typeof window !== 'undefined' && window.companyId) {
          await hub.invoke('LeaveCompanyGroup', String(window.companyId));
        }
      } catch {}
      await hub.stop();
    }
  } catch {}
  hub = null;
  conn = null;
}
