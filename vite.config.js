import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: 'https://abutorab-pub.ir/hodhodak01/',
//  base: process.env.VITE_BASE_PATH || '/',
  
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.{svg,png}', 'manifest.webmanifest'],
      manifest: false,
      workbox: {
        // Full offline support: precache the whole build output
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,ttf,json,webmanifest}'],
        // Kids' content can include audio/images — allow larger precache entries
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Persian webfonts served at runtime (if any are external)
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Educational media (audio lessons, story images) — cache as used
            urlPattern: /\.(?:mp3|ogg|wav|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hodhodak-media',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true, // lets you test the service worker in `npm run dev`
      },
    }),
  ],
});
