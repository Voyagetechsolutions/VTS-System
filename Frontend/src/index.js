import React from 'react';
import ReactDOM from 'react-dom/client';
import { initIOSPolyfills, isIOS } from './utils/iosPolyfills';

// Early iOS detection and basic logging
const userAgent = navigator.userAgent || '';
const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
const isOldIOS = /OS [1-9]_/.test(userAgent) || /OS 1[0-2]_/.test(userAgent);

console.log('Device detection:', {
  userAgent,
  isIOSDevice,
  isOldIOS,
  location: window.location.href
});

// Initialize iOS polyfills early
if (isIOSDevice) {
  console.log('iOS device detected, applying compatibility fixes');
  try {
    initIOSPolyfills();
  } catch (error) {
    console.error('Failed to init iOS polyfills:', error);
  }
}

// Conditional App import based on iOS compatibility
let App;
try {
  if (isIOSDevice && isOldIOS) {
    console.log('Loading iOS-compatible App version');
    App = require('./App-ios-compatible').default;
  } else {
    App = require('./App').default;
  }
} catch (error) {
  console.error('Failed to load App component:', error);
  // Ultimate fallback
  App = function() {
    return React.createElement('div', {
      style: {
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui'
      }
    }, 
      React.createElement('h1', null, 'Loading Error'),
      React.createElement('p', null, 'Unable to load the application. Please try refreshing the page.'),
      React.createElement('button', {
        onClick: function() { window.location.reload(); },
        style: { padding: '10px 20px', fontSize: '16px' }
      }, 'Refresh Page'),
      React.createElement('pre', {
        style: { textAlign: 'left', fontSize: '12px', background: '#f5f5f5', padding: '10px', marginTop: '20px' }
      }, error.toString())
    );
  };
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

// iOS-safe rendering
const root = ReactDOM.createRoot(document.getElementById('root'));

try {
  // Render with conditional Sentry wrapper and iOS considerations
  if (sentryInitialized && window.Sentry && window.Sentry.ErrorBoundary && !isOldIOS) {
    console.log('Rendering with Sentry ErrorBoundary');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(window.Sentry.ErrorBoundary, {
          fallback: React.createElement('div', null, 'Something went wrong.')
        },
          React.createElement(App),
          process.env.NODE_ENV !== 'production' ? React.createElement(ErrorButton) : null
        )
      )
    );
  } else {
    // Fallback without Sentry for iOS compatibility
    console.log('Rendering with custom ErrorBoundary');
    const ErrorBoundary = require('./components/common/ErrorBoundary').default;
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(ErrorBoundary, null,
          React.createElement(App),
          process.env.NODE_ENV !== 'production' ? React.createElement(ErrorButton) : null
        )
      )
    );
  }
} catch (renderError) {
  console.error('Render failed, using minimal fallback:', renderError);
  
  // Minimal fallback that should work on any device
  root.render(
    React.createElement('div', {
      style: {
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }
    },
      React.createElement('h1', null, 'Application Error'),
      React.createElement('p', null, 'Failed to start the application.'),
      React.createElement('button', {
        onClick: function() { window.location.reload(); },
        style: {
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }
      }, 'Reload Page'),
      React.createElement('details', {
        style: { marginTop: '20px', textAlign: 'left', width: '100%', maxWidth: '600px' }
      },
        React.createElement('summary', null, 'Error Details'),
        React.createElement('pre', {
          style: {
            fontSize: '12px',
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '5px',
            overflow: 'auto'
          }
        }, renderError.toString())
      )
    )
  );
}
