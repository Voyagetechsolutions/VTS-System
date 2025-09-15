import React from 'react';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || 'https://d09c3820e33b30a115bdc29a4351792f@o4510000933502976.ingest.de.sentry.io/4510000938745936',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
  release: process.env.REACT_APP_RELEASE || 'v1',
  sendDefaultPii: true
});
import ReactDOM from 'react-dom/client';
import App from './App';

// Optional: quick test button for Sentry errors (dev only)
function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 9999 }}
    >
      Break the world
    </button>
  );
}

(async () => {
  try {
    const lrId = process.env.REACT_APP_LOGROCKET_ID;
    if (lrId) {
      const { default: LogRocket } = await import('logrocket');
      LogRocket.init(lrId, {
        dom: { textSanitizer: true },
        network: { requestSanitizer: () => null, responseSanitizer: () => null },
      });
      try {
        LogRocket.getSessionURL((url) => {
          try { Sentry.setContext('LogRocket', { sessionURL: url }); } catch {}
        });
      } catch {}
    }
  } catch {}
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>}>
      <App />
      {process.env.NODE_ENV !== 'production' ? <ErrorButton /> : null}
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
