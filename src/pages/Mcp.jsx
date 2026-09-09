import { Check, ArrowRight } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import SiteStyles from '../components/SiteStyles';
import { PageCta } from '../components/PageShell';
import { asset, APP_URL, useReveal } from '../lib/site';

/**
 * /mcp/ — Vonod MCP.
 *
 * Shape comes from the subject: this is a developer surface, so the page is
 * laid out like reference documentation — the config lands in the hero rather
 * than three scrolls down, and the tool surface is a two-column reference
 * with a sticky index instead of a grid of marketing cards. Mono carries more
 * of the page here than anywhere else on the site, on purpose.
 *
 * IMPORTANT, for whoever edits this next: there are two MCP servers and this
 * page is NOT about the one in the repo.
 *
 *   1. mcp-workflow-editor — exists today. Six graph tools, stateless, no DB
 *      access, spawned by the Django bridge. Internal plumbing for the
 *      chat-driven canvas; not something a customer connects to.
 *
 *   2. Vonod MCP (this page) — the public surface. Campaigns, voice agents,
 *      contacts, calls, numbers and provider keys. It needs DB access and
 *      owner-scoped auth, which is exactly what (1) refuses to have, so it is
 *      a different server and a real build.
 *
 * As of this writing (2) DOES NOT EXIST. No tools, no package, nothing
 * published under the `vonod-mcp` command in the snippet. The page is written
 * in the present tense on the owner's explicit instruction, ahead of the
 * build. Two things follow:
 *
 *   - GROUPS below is the intended vocabulary, published to the world the
 *     moment this page ships. When the server lands, the names must match it
 *     exactly — they are the first thing anyone will type.
 *   - Whoever ships this page takes on the promise. Either the server lands
 *     first, or the snippet gets gated behind an access request.
 *
 * No sparkle/star iconography anywhere on this site, deliberately: it is the
 * house style of every AI product on the internet and the owner does not want
 * it. The badge uses the Vonod mark; the canvas prompt uses a `›` caret.
 */

const CONFIG = `{
  "mcpServers": {
    "vonod": {
      "command": "vonod-mcp"
    }
  }
}`;

const TRANSCRIPT = [
  { who: 'you', text: 'Make me a campaign that calls the leads in leads.csv and books demos.' },
  { tool: 'create_voice_agent', result: '“Demo booker” · 5 nodes' },
  { tool: 'create_campaign',    result: 'Northwind Q1' },
  { tool: 'import_contacts',    result: '1,204 contacts · 18 duplicates dropped' },
  { tool: 'launch_campaign',    result: 'dialing from 9:00, per contact time zone' },
  { who: 'claude', text: 'Campaign is live. 1,204 contacts queued, dialing from 9am in each contact’s own time zone, retrying no-answers twice.' },
  { who: 'you', text: 'How’s it going?' },
  { tool: 'campaign_status',    result: '312 dialed · 38% connect · 47 booked' },
];

const GROUPS = [
  { id: 'campaigns', name: 'Campaigns', items: [
    ['create_campaign',  'Define a run: which list, which agent, which calling windows.'],
    ['launch_campaign',  'Start dialing.'],
    ['pause_campaign',   'Stop mid-run without losing progress.'],
    ['campaign_status',  'Dialed, connected, outcomes and spend, while it runs.'],
  ]},
  { id: 'agents', name: 'Voice agents', items: [
    ['create_voice_agent',       'Describe the call; get a graph with branches and tool calls.'],
    ['edit_voice_agent',         'Rewire nodes, edges and conditions by asking.'],
    ['manage_dynamic_variables', 'The {fields} every call gets fed.'],
  ]},
  { id: 'contacts', name: 'Contacts', items: [
    ['import_contacts',  'From a CSV or a connected source, deduped on the way in.'],
    ['segment_contacts', 'Slice by time zone, priority, or any tag you use.'],
  ]},
  { id: 'calls', name: 'Calls', items: [
    ['place_call',     'One call, right now, to one number.'],
    ['call_status',    'Follow it while it is still running.'],
    ['get_transcript', 'Turns, tool calls and outcome, once it hangs up.'],
  ]},
  { id: 'numbers', name: 'Numbers', items: [
    ['list_phone_numbers',    'What you own, and what each one answers with.'],
    ['assign_inbound_number', 'Point a number straight at an agent.'],
  ]},
  { id: 'keys', name: 'Provider keys', items: [
    ['list_integrations',   'Which providers are connected, and which are missing.'],
    ['connect_integration', 'Returns a link to connect one. Keys never travel through the chat.'],
  ]},
];

const LIMITS = [
  ['Keys never travel through the chat',
   'Asking to connect a provider returns a link you open yourself. An API key pasted into a chat ends up in the client’s history and in its logs, so the tool refuses to take one.'],
  ['Scoped to you',
   'Every tool runs as your account and sees only your campaigns, agents and numbers. There is no tool that reaches across owners.'],
  ['Nothing is saved behind your back',
   'Graph edits come back as changes for you to keep or throw away. Launching a run is the one thing that always asks first.'],
];

const TOOL_COUNT = GROUPS.reduce((n, g) => n + g.items.length, 0);

export default function McpPage() {
  useReveal();

  return (
    // overflow-x-CLIP, not hidden: `hidden` makes this a scroll container,
    // which silently breaks `position: sticky` on the reference index below
    // (it scrolled away instead of pinning). `clip` cuts overflow the same way
    // without creating that container.
    <div className="min-h-screen bg-canvas text-body-strong font-sans antialiased overflow-x-clip">
      <SiteStyles />
      <SiteHeader current="/mcp/" />

      {/* ── Hero: config on arrival ───────────────────────────────────
          A developer surface should show its setup immediately, not after
          two sections of prose. */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div className="lp-glow" aria-hidden="true" />
        <div className="relative max-w-content mx-auto px-6 py-xxl md:py-section grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p data-reveal className="reveal text-caption-uppercase uppercase text-muted mb-lg">Vonod MCP</p>
            <h1 data-reveal className="reveal text-display-lg sm:text-display-xl font-medium tracking-[-0.03em] leading-[1.05] mb-lg"
                style={{ transitionDelay: '60ms' }}>
              Vonod, from your terminal.
            </h1>
            <p data-reveal className="reveal text-title-md text-body text-pretty mb-xl" style={{ transitionDelay: '120ms' }}>
              Connect Vonod MCP to Claude, Cursor, or your own CLI and everything the platform does
              becomes something you can ask for — create an agent, import a list, launch a run,
              check where it stands.
            </p>
            <div data-reveal className="reveal flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.6875rem] text-muted"
                 style={{ transitionDelay: '180ms' }}>
              <span>{TOOL_COUNT} tools</span>
              <span>no callback URL</span>
              <span>any MCP client</span>
            </div>
          </div>

          <div data-reveal className="reveal" style={{ transitionDelay: '160ms' }}>
            <div className="rounded-xl border border-hairline bg-canvas-deep overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                  <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                  <span className="w-2 h-2 rounded-full bg-hairline-strong" />
                </span>
                <span className="ml-1.5 font-mono text-[0.6875rem] text-muted">claude_desktop_config.json</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[0.8125rem] leading-relaxed text-body-strong">{CONFIG}</pre>
            </div>
            <p className="mt-4 text-body-sm text-body">
              One line of config. The first time you ask for something it walks you through
              connecting your account and your provider keys.
            </p>
          </div>
        </div>
      </section>

      {/* ── The scenario ─────────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[42rem] mb-12">
          <h2 className="text-display-sm sm:text-display-md font-medium mb-base">One instruction, four tools, a live campaign.</h2>
          <p className="text-body text-body-md">
            You describe the outcome; Vonod does the parts. Nothing here needed the dashboard.
          </p>
        </div>

        <div data-reveal className="reveal max-w-[46rem] card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline">
            <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
            <span className="text-caption font-medium text-body">Claude Code</span>
            <span className="ml-auto badge-pill">
              <img src={asset('logo_blanco_vonod.png')} alt="" className="w-3 h-3 object-contain" />
              vonod
            </span>
          </div>
          <div className="p-4 md:p-5 grid gap-3">
            {TRANSCRIPT.map((line, i) =>
              line.tool ? (
                <div key={i} className="flex items-center gap-2.5 pl-1">
                  <Check size={13} className="shrink-0 text-success" aria-hidden="true" />
                  <span className="font-mono text-[0.75rem] text-body-strong shrink-0">{line.tool}</span>
                  <span className="font-mono text-[0.6875rem] text-muted truncate">{line.result}</span>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`shrink-0 w-12 text-right text-[0.625rem] font-semibold mt-0.5 ${
                    line.who === 'you' ? 'text-muted' : 'text-body-strong'}`}>
                    {line.who === 'you' ? 'You' : 'Claude'}
                  </span>
                  <p className="flex-1 text-body-sm leading-relaxed text-body-strong">{line.text}</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Reference ────────────────────────────────────────────────
          A sticky index and a running list, the way an API reference reads —
          not six equal cards in a grid. */}
      <section id="reference" className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-xxl md:py-section">
          <div data-reveal className="reveal flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-12">
            <h2 className="text-display-sm sm:text-display-md font-medium">Reference</h2>
            <span className="font-mono text-[0.75rem] text-muted">{TOOL_COUNT} tools · 6 groups</span>
          </div>

          <div className="grid lg:grid-cols-[13rem_1fr] gap-x-12">
            <nav className="hidden lg:block" aria-label="Tool groups">
              <ul className="sticky top-24 grid gap-1 border-l border-hairline">
                {GROUPS.map((g) => (
                  <li key={g.id}>
                    <a href={`#${g.id}`}
                       className="block -ml-px border-l border-transparent pl-4 py-1.5 text-body-sm text-body
                                  hover:text-body-strong hover:border-hairline-strong transition-colors">
                      {g.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="min-w-0">
              {GROUPS.map((g, gi) => (
                <section key={g.id} id={g.id} data-reveal className="reveal scroll-mt-28 pt-8 first:pt-0"
                         style={{ transitionDelay: `${Math.min(gi, 3) * 60}ms` }}>
                  <h3 className="text-caption-uppercase uppercase text-body pb-3 mb-1 border-b border-hairline">
                    {g.name}
                  </h3>
                  <dl>
                    {g.items.map(([name, desc]) => (
                      <div key={name}
                           className="grid sm:grid-cols-[16rem_1fr] gap-x-8 gap-y-1 py-4 border-b border-hairline-soft">
                        <dt className="font-mono text-[0.8125rem] text-body-strong break-all">{name}</dt>
                        <dd className="text-body-sm text-body">{desc}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Limits ───────────────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16">
          <div data-reveal className="reveal">
            <p className="text-caption-uppercase uppercase text-body mb-lg">What it will not do</p>
            <h2 className="text-display-sm sm:text-display-md font-medium mb-base">Connected, not handed over.</h2>
            <p className="text-body text-body-md">
              An MCP server sits inside a tool that reads everything you type. These are the limits
              that make it a reasonable thing to connect.
            </p>
          </div>
          <dl data-reveal className="reveal" style={{ transitionDelay: '100ms' }}>
            {LIMITS.map(([t, d], i) => (
              <div key={t} className="py-5 border-b border-hairline first:pt-0 last:border-b-0">
                <dt className="flex items-baseline gap-3 font-medium text-title-sm mb-2">
                  <span className="font-mono text-[0.6875rem] text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  {t}
                </dt>
                <dd className="text-body-sm text-body pl-8">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal className="reveal mt-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-body-sm">
          <a href="/voice-agents/" className="group inline-flex items-center gap-1.5 font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
            What it builds: voice agents
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a href="/campaigns/" className="group inline-flex items-center gap-1.5 font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
            What it runs: campaigns
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      <PageCta
        title="Connect it and ask for a campaign."
        body="Create an account, bring your own provider keys, and drive the whole platform from the editor you already have open."
      />

      <SiteFooter />
    </div>
  );
}
