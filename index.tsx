
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAppDB } from './utils/db';

const startApp = async () => {
  try {
    // Inicializar Motor SQLite
    console.log("🚀 Iniciando motor SQLite...");
    await initializeAppDB();
    
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error("Root element not found");

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("❌ Fallo crítico al iniciar la base de datos:", error);
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h1 style="color: #ef4444;">Error de Base de Datos</h1>
        <p>No se pudo inicializar el motor SQLite local. Verifique los permisos del navegador.</p>
        <button onclick="location.reload()" style="padding: 0.5rem 1rem; cursor: pointer;">Reintentar</button>
      </div>
    `;
  }
};

startApp();
