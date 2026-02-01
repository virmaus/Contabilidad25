
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    port: 5173,
    strictPort: true, // Si el puerto 5173 está ocupado, no abrirá otro; así proteges tus datos.
  }
});
