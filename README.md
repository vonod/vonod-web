# Vonod web

The public landing page for Vonod. Standalone

Live at **https://vonod.ai** — published by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to
`main`. The custom domain comes from `public/CNAME` plus the domain set in
the repo's Settings → Pages; `vite.config.js`'s `base: '/'` assumes assets
are served from that domain root, so removing the custom domain without also
reverting `base` breaks every asset path.
