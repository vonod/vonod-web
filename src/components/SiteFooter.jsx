import { asset } from '../lib/site';

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="max-w-content mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-body">
        <div className="flex items-center gap-2.5">
          <img src={asset('logo_blanco_vonod.png')} alt="" className="w-6 h-6 object-contain" />
          <span className="font-medium text-body-strong">Vonod</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a href="/voice-agents/" className="hover:text-body-strong transition-colors">Voice agents</a>
          <a href="/campaigns/" className="hover:text-body-strong transition-colors">Campaigns</a>
          {/* Vonod MCP is intentionally not linked yet — see SiteHeader. */}
        </nav>
        <p>Self-hostable, AGPL-3.0 — audit the code or run it yourself.</p>
      </div>
      <div className="max-w-content mx-auto px-6 pb-8 text-body-sm text-muted">
        © {new Date().getFullYear()} Vonod. Orchestration for AI agent campaigns.
      </div>
    </footer>
  );
}
