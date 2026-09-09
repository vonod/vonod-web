import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Standalone marketing site. Builds to static files served by GitHub Pages.
//
// Multi-page, not a client-side router. Each page is its own HTML entry, so
// every URL is a real file with its own <title>, description, canonical and
// OG tags (MESSAGING.md §6 cares about exactly this) and needs no JS to be
// indexed. A router would have collapsed all four pages onto one set of tags.
//
// Adding a page: create <slug>/index.html, src/<slug>.jsx, and one line in
// `input` below. The directory form gives /<slug>/ rather than /<slug>.html.
export default defineConfig({
  // Served from https://vonod.ai (public/CNAME), the domain root — not the
  // old https://vonod.github.io/vonod-web/ project-page path, so assets are
  // rooted at '/'. Changing this back to a subpath breaks the custom domain;
  // don't revert it without also removing public/CNAME.
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        voiceAgents: resolve(__dirname, 'voice-agents/index.html'),
        campaigns: resolve(__dirname, 'campaigns/index.html'),
        mcp: resolve(__dirname, 'mcp/index.html'),
      },
    },
  },
  // Honour PORT so a second checkout (or a preview harness) can run
  // alongside the one already sitting on 3001.
  server: { port: Number(process.env.PORT) || 3001 },
});
