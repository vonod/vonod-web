# Vonod — marketing site

The public landing page for [Vonod](https://vonod-frontend.fly.dev). Standalone
and static by design: React + Vite, no backend, no app bundle. Visitors to the
site never download a byte of the product.

Live at **https://vonod.github.io/vonod-web/** — published by
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) on every push to
`main`.

## Local development

```bash
npm install
npm run dev      # http://localhost:3001/vonod-web/
npm run build    # -> dist/
npm run preview
```

## Where the CTAs point

Every "Sign in" / "Start building" button reads `VITE_APP_URL`, which defaults
to `https://vonod-frontend.fly.dev`. It is set at build time in the Pages
workflow's `env:` block — change it there when the app gets its own domain.

## Relationship to the main repo

This site started as the `web/` directory of the private `vonod/vonod`
monorepo. It lives here so it can be published on GitHub Pages, which the free
plan does not offer for private repos. **This repo is now the source of
truth** — edit the landing page here, not in `vonod/vonod/web/`.
