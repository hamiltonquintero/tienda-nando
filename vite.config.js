import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Incluye los assets del public/ en el precache
      includeAssets: ['logo.png', 'logo.jpg', 'logo_banner.png', 'logo_banner.jpg'],
      manifest: {
        name: 'Surtimueve más',
        short_name: 'Surtimueve',
        description: 'Sistema de inventario, ventas y fiao para Surtimueve más',
        theme_color: '#0284c7',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cachea todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}'],
        // Estrategia: sirve desde caché primero, actualiza en background
        runtimeCaching: [
          {
            // Fuentes de Google — cache-first con expiración de 1 año
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
});
