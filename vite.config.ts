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
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Bhajan Bodh',
        short_name: 'BhajanBodh',
        description: 'Daily devotional bhajan games — guess, sing, and search',
        theme_color: '#D97E00',
        background_color: '#FBF3DF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
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
