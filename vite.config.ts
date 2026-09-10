import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/BibleExperience/',
  plugins: [
    react(),
    VitePWA({
      // Registration is done manually in src/main.tsx via
      // `virtual:pwa-register`, so don't also inject an auto-registration
      // script into index.html.
      injectRegister: false,
      registerType: 'autoUpdate',
      manifest: {
        name: 'The Bible Experience',
        short_name: 'Bible Experience',
        description: 'See. Understand. Believe.',
        start_url: './',
        display: 'standalone',
        background_color: '#071018',
        theme_color: '#071018',
        icons: [
          {
            src: 'assets/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,jpg,json,webmanifest}'],
        // The largest episode art asset is ~2.6 MB, above workbox's 2 MiB
        // default precache limit — raise it with headroom for future art.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      // Leave dev-mode SW generation off (the default) so the service
      // worker never intercepts requests during `vite dev`.
    }),
  ],
  build: { target: 'es2020', sourcemap: false },
});
