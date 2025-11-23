import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Lumeni',
        short_name: 'Lumeni',
        description: 'AI Powered Educational Assistant',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'android-chrome-192x192.png', // This matches the file you got from the converter
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png', // This matches the file you got from the converter
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})