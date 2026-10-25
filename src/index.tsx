import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UPDATE_READY_EVENT } from './components/common/UpdateNotice';
import { isNativeApp } from './services/appPlatform';
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
if (!isNativeApp() && 'serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    // A worker replacing an existing one means a new deploy is live: offer a refresh.
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) window.dispatchEvent(new Event(UPDATE_READY_EVENT));
    });
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
