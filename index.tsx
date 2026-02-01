
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAppDB } from './utils/db';

const startApp = async () => {
  try {
    console.log("🚀 Iniciando motor de datos...");
    await initializeAppDB();
    
    const rootElement = document.getElementById('root');
    if (!rootElement) throw new Error("No se encontró el elemento 'root' en el DOM.");

    console.log("⚛️ Renderizando aplicación React...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error: any) {
    console.error("❌ ERROR CRÍTICO AL INICIAR APP:", error);
    
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 3rem; text-align: center; font-family: -apple-system, sans-serif; background: #fff; border-radius: 1rem; margin: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="color: #ef4444; font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h1 style="color: #1e293b; margin: 0 0 1rem 0;">Fallo de Inicialización</h1>
          <p style="color: #64748b; margin-bottom: 2rem;">Hubo un problema al cargar los módulos o la base de datos local.</p>
          <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: left; margin-bottom: 2rem; font-family: monospace; font-size: 12px; border: 1px solid #e2e8f0; max-height: 150px; overflow: auto;">
            <strong>Detalle del error:</strong><br/>
            ${error.message || error}
          </div>
          <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer;">
            Reintentar Carga
          </button>
        </div>
      `;
    }
  }
};

startApp();
