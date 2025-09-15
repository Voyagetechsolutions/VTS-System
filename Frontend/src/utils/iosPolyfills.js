// iOS Safari polyfills and compatibility fixes

// Polyfill for ResizeObserver (iOS Safari 13.4+)
if (!window.ResizeObserver) {
  console.warn('ResizeObserver not supported, using polyfill');
  window.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.entries = [];
    }
    observe(element) {
      this.entries.push(element);
      // Fallback to window resize
      window.addEventListener('resize', () => {
        this.callback([{ target: element }]);
      });
    }
    unobserve(element) {
      this.entries = this.entries.filter(entry => entry !== element);
    }
    disconnect() {
      this.entries = [];
    }
  };
}

// Fix for iOS Safari viewport height issues
function fixIOSViewport() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 500);
    });
  }
}

// Fix for iOS Safari position: fixed issues
function fixIOSPositionFixed() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Prevent viewport scrolling when modal/drawer is open
    let scrollTop = 0;
    
    window.preventScroll = () => {
      scrollTop = window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollTop}px`;
      document.body.style.width = '100%';
    };
    
    window.restoreScroll = () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollTop);
    };
  } else {
    // No-op for non-iOS
    window.preventScroll = () => {};
    window.restoreScroll = () => {};
  }
}

// Fix for iOS Safari performance issues
function optimizeForIOS() {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // Disable hover effects on iOS
    const style = document.createElement('style');
    style.textContent = `
      @media (hover: none) and (pointer: coarse) {
        *:hover {
          background-color: inherit !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Optimize touch scrolling
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }
}

// Global error handler for iOS debugging
function setupIOSErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error on iOS:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      userAgent: navigator.userAgent
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection on iOS:', {
      reason: event.reason,
      userAgent: navigator.userAgent
    });
    // Prevent default browser behavior
    event.preventDefault();
  });
}

// Initialize all iOS fixes
export function initIOSPolyfills() {
  try {
    fixIOSViewport();
    fixIOSPositionFixed();
    optimizeForIOS();
    setupIOSErrorHandling();
    console.log('iOS polyfills initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize iOS polyfills:', error);
  }
}

// Check if running on iOS
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Get iOS version if available
export const getIOSVersion = () => {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: match[3] ? parseInt(match[3], 10) : 0
    };
  }
  return null;
};
