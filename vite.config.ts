import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Sai-Bhajan-Quiz/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Sai Bhajan Quiz',
        short_name: 'BhajanQuiz',
        description: 'Daily devotional bhajan quiz game for Sai devotees',
        theme_color: '#f97316',
        background_color: '#fffbeb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        navigateFallbackDenylist: [/OneSignalSDKWorker\.js$/],
        runtimeCaching: [
          {
            urlPattern: /\/audio\/clips\/.+\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-clips', expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
          {
            urlPattern: /\/data\/.+\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'bhajan-data', expiration: { maxAgeSeconds: 24 * 60 * 60 } },
          },
          {
            urlPattern: /\/images\/deities\/.+\.(jpg|jpeg|png|webp)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'deity-images', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
})
