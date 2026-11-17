import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('App update available');
  },
  onOfflineReady() {
    console.log('Luxe Ludo is ready for offline play');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
