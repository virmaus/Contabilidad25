
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro de Service Worker optimizado
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos el path relativo asegurando que sea el del root
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('✅ Service Worker activo. Alcance:', registration.scope);
        
        // Verificar actualizaciones del repo cada vez que se carga la página
        registration.update();

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Notificar al usuario que hay una nueva versión (vía evento custom)
                window.dispatchEvent(new CustomEvent('pwa-update-available'));
              }
            };
          }
        };
      })
      .catch(error => {
        console.error('❌ Error registrando el Service Worker:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
