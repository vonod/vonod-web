import { ArrowRight } from 'lucide-react';
import { asset, APP_URL } from '../lib/site';

// The three product pages, in the order a visitor meets the product: you
// build an agent, you run a campaign with it, you drive both from your own
// tools. Deep pages exist because the landing was carrying all three at once
// and had stopped being readable.
const NAV = [
  { href: '/voice-agents/', label: 'Voice agents' },
  { href: '/campaigns/', label: 'Campaigns' },
  { href: '/mcp/', label: 'Vonod MCP' },
];

export default function SiteHeader({ current }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-canvas/80 border-b border-hairline">
      <nav className="max-w-content mx-auto px-6 h-16 flex items-center justify-between" aria-label="Main">
        <a href="/" className="flex items-center gap-2.5 rounded-sm" aria-label="Vonod — home">
          <img src={asset('logo_blanco_vonod.png')} alt="" className="w-7 h-7 object-contain" />
          <span className="font-semibold tracking-tight text-title-md">Vonod</span>
        </a>

        <div className="hidden md:flex items-center gap-lg text-nav-link">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? 'page' : undefined}
              className={`transition-colors hover:text-body-strong ${
                current === l.href ? 'text-body-strong' : 'text-body'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a href={APP_URL} className="btn-tertiary px-base py-2.5 hidden sm:inline-flex">Log in</a>
          <a href={APP_URL} className="btn-primary group">
            Get started
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </nav>

      {/* Small screens get the product links as their own row. A hamburger
          would hide the only navigation the site has behind a tap. */}
      <nav className="md:hidden border-t border-hairline" aria-label="Sections">
        <div className="max-w-content mx-auto px-6 flex items-center gap-lg overflow-x-auto text-nav-link">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? 'page' : undefined}
              className={`py-2.5 whitespace-nowrap border-b-2 transition-colors ${
                current === l.href
                  ? 'text-body-strong border-ink'
                  : 'text-body border-transparent hover:text-body-strong'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
