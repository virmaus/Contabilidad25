import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Contador Pro Analytics',
        short_name: 'Contador Pro',
        description: 'Herramienta de análisis financiero local para contadores.',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2920/2920349.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2920/2920349.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});