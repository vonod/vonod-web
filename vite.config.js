import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone marketing site. Tiny by design — just React + the one landing
// page, nothing from the app. Builds to static files served by GitHub Pages.
export default defineConfig({
  // Served from https://vonod.github.io/vonod-web/, not a domain root.
  base: '/vonod-web/',
  plugins: [react()],
  server: { port: 3001 },
});
