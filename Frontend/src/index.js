import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initIOSPolyfills, isIOS } from './utils/iosPolyfills';

// Initialize iOS polyfills early
if (isIOS()) {
  console.log('iOS device detected, applying compatibility fixes');
  initIOSPolyfills();
}

// iOS-safe Sentry initialization
let sentryInitialized = false;
try {
  if (typeof window !== 'undefined' && process.env.REACT_APP_SENTRY_DSN) {
    const Sentry = require('@sentry/react');
    const { BrowserTracing } = require('@sentry/tracing');
    
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1, // Reduced for iOS performance
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_RELEASE || 'v1',
      sendDefaultPii: false, // More privacy-friendly
      beforeSend(event) {
        // Filter out common iOS Safari errors
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('ResizeObserver loop limit exceeded') ||
              error?.value?.includes('Non-Error promise rejection captured') ||
              error?.value?.includes('Loading chunk')) {
            return null;
          }
        }
        return event;
      }
    });
    
    window.Sentry = Sentry;
    sentryInitialized = true;
  }
} catch (error) {
  console.warn('Sentry initialization failed:', error);
}

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

// iOS-safe LogRocket initialization
(async () => {
  try {
    const lrId = process.env.REACT_APP_LOGROCKET_ID;
    if (lrId && typeof window !== 'undefined') {
      // Check if we're on iOS and skip LogRocket if it causes issues
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (!isIOS || process.env.NODE_ENV === 'development') {
        const { default: LogRocket } = await import('logrocket');
        LogRocket.init(lrId, {
          dom: { textSanitizer: true },
          network: { requestSanitizer: () => null, responseSanitizer: () => null },
          console: { isEnabled: { log: false, info: false } }, // Reduce iOS console noise
        });
        
        if (sentryInitialized && window.Sentry) {
          try {
            LogRocket.getSessionURL((url) => {
              window.Sentry.setContext('LogRocket', { sessionURL: url });
            });
          } catch (err) {
            console.warn('LogRocket-Sentry integration failed:', err);
          }
        }
      }
    }
  } catch (error) {
    console.warn('LogRocket initialization failed:', error);
  }
})();

const root = ReactDOM.createRoot(document.getElementById('root'));

// Render with conditional Sentry wrapper
if (sentryInitialized && window.Sentry?.ErrorBoundary) {
  root.render(
    <React.StrictMode>
      <window.Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>}>
        <App />
        {process.env.NODE_ENV !== 'production' ? <ErrorButton /> : null}
      </window.Sentry.ErrorBoundary>
    </React.StrictMode>
  );
} else {
  // Fallback without Sentry for iOS compatibility
  const ErrorBoundary = require('./components/common/ErrorBoundary').default;
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
        {process.env.NODE_ENV !== 'production' ? <ErrorButton /> : null}
      </ErrorBoundary>
    </React.StrictMode>
  );
}
