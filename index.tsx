import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Explicitly unregister any potential service workers to prevent caching issues and force updates
// Wrapped in 'load' event listener to ensure document is ready and avoid "invalid state" errors
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        console.log('Unregistering service worker:', registration);
        registration.unregister();
      }
    }).catch(err => {
      // Log as debug/warn to avoid cluttering console with non-critical errors
      console.debug('SW Unregister attempt finished:', err);
    });
  });
}