import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// reportWebVitals removed - not needed for PWA

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA — production only.
// In development it must be absent (a cache-first worker serves stale bundles).
if ('serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is best-effort.
      });
    });
  } else {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
  }
}

// Performance monitoring removed for PWA build 