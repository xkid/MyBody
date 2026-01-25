import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Explicitly unregister any potential service workers to prevent caching issues and force updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('Unregistering service worker:', registration);
      registration.unregister();
    }
  }).catch(err => console.error('SW Unregister failed:', err));
}

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