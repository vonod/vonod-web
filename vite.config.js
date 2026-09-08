import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone marketing site. Tiny by design — just React + the one landing
// page, nothing from the app. Builds to static files served by GitHub Pages.
export default defineConfig({
  // Served from https://vonod.ai (public/CNAME), the domain root — not the
  // old https://vonod.github.io/vonod-web/ project-page path, so assets are
  // rooted at '/'. Changing this back to a subpath breaks the custom domain;
  // don't revert it without also removing public/CNAME.
  base: '/',
  plugins: [react()],
  // Honour PORT so a second checkout (or a preview harness) can run
  // alongside the one already sitting on 3001.
  server: { port: Number(process.env.PORT) || 3001 },
});
