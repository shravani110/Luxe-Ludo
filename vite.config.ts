import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/favicon.png'],
      manifest: {
        name: 'Luxe Ludo - Cyber Mobile',
        short_name: 'Ludo Luxe',
        description: 'Mobile-optimized Ludo game with AI bots, pass-and-play, and dark glassmorphic Bento UI',
        theme_color: '#07090e',
        background_color: '#07090e',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
});
