import {
  Radio, Globe, Gauge, Target, Group, Timer,
  ArrowRight, ChevronRight, Bot, Terminal,
} from 'lucide-react';
import GlobeBackground from './components/GlobeBackground';
import LiveTranscript from './components/LiveTranscript';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import SiteStyles from './components/SiteStyles';
import { asset, APP_URL, useReveal } from './lib/site';

/**
 * Vonod marketing landing — standalone static site (its own app, decoupled from
 * the platform). Structure from the Composio design system captured by RicoUI
 * on Vonod's own monochrome palette: dark-only, near-black canvas. Type,
 * spacing and radii come from that token set (see index.css /
 * tailwind.config.js) — no raw hex here beyond the two transcript speaker
 * colours, which are token values passed to inline styles because they also
 * drive a CSS gradient.
 *
 * The hero is type and one button, nothing else: the claim at the largest size
 * on the page, with the dot globe sunk beneath it as a horizon. The product
 * demo is the section straight after, so the evidence is one scroll away
 * rather than competing with the headline. CSS-only motion, disabled under
 * prefers-reduced-motion. CTAs point at the app (VITE_APP_URL).
 *
 * MESSAGING.md is the source of truth for the copy. The short version: this
 * page no longer sells "an AI phone-calling company" — it sells deployable
 * voice agents (the agent is the unit; campaigns, inbound support, whatever
 * the workload is, are things you do with one, not the definition of the
 * product) and pushes toward trying that immediately, not toward reading
 * about it. The billing wedge (you pay for the orchestration, never a markup
 * on the AI) is still stated up front, in the subhead rather than the H1 —
 * see MESSAGING.md §1, §3, §4 for how that trade-off got made.
 */


// Vite rewrites absolute asset URLs inside index.html but not runtime strings
// in JSX, so public/ assets have to carry the base path themselves. That base
// is '/' today (the site is served from the vonod.ai domain root via
// public/CNAME) rather than a GitHub Pages project-page subpath, but this
// stays in place so nothing here breaks if that ever changes again.


const PILLARS = [
  { href: '/voice-agents/', icon: Bot, title: 'Voice agents',
    body: 'Design what happens inside a call. Branch on what the person actually says, call your tools mid-sentence, end on an outcome — and build the whole graph by describing it.',
    cta: 'How agents work' },
  { href: '/campaigns/', icon: Radio, title: 'Campaigns',
    body: 'Run one agent across thousands of contacts. Import a list, dial in each contact’s own time zone, branch on outcomes, retry what didn’t land.',
    cta: 'How campaigns work' },
  { href: '/mcp/', icon: Terminal, title: 'Vonod MCP',
    body: 'Drive all of it from Claude, Cursor or your own CLI. Create the agent, launch the run, check where it stands — in plain language, without opening Vonod.',
    cta: 'Explore Vonod MCP' },
];

const FEATURES = [
  { icon: Radio, title: 'Mass dialing', body: 'Launch campaigns that dial thousands of numbers per hour. Concurrent call support built in from day one — no tier to unlock.' },
  { icon: Globe, title: 'Smart scheduling', body: 'Time-zone aware dispatch, automated retries on busy or no-answer, contact list management with dedup and segmentation.' },
  { icon: Gauge, title: 'Live campaign analytics', body: 'Connect rate, outcome distribution, cost per conversation, and latency — all streaming in real time per campaign.' },
  { icon: Target, title: 'Outcome-based routing', body: 'Branch each call individually. Appointment booked? Pause and retry. Wrong person? Tag and skip. All at campaign scale.' },
  { icon: Group, title: 'Multi-agent campaigns', body: 'Assign different agents, voices, and models to different segments. Run A/B tests across 10,000 calls in a single campaign.' },
  { icon: Timer, title: 'Sub-second at scale', body: 'Under 800 ms turn-taking even at 1,000+ concurrent calls. No degradation as your campaign grows.' },
];

// One campaign run, as an illustration rather than a live readout — the
// band that renders these labels it as such.
const RUN_STATS = [
  { v: '312', k: 'Concurrent calls', note: 'Dialing at the same instant, not queued behind each other.' },
  { v: '38.2%', k: 'Connect rate', note: 'Answered, and held past the opening line.' },
  { v: '$0.14', k: 'Cost per call', note: 'All-in, on your own provider keys.' },
  { v: '2h 14m', k: 'Run time', note: 'Launch to the last number on the list.' },
];

// BYOK leads (step 01) rather than being implied. MESSAGING.md §1: it is a
// differentiator AND an onboarding tax, and a visitor who has to open four
// provider accounts before their first call should read that here, not
// discover it after signing up.
//
// Steps 02/03 were rewritten because the old set ("Upload & segment",
// "design your campaign", "Launch at scale") described three manual chores
// and buried the actual experience — you describe the agent and the graph
// gets built for you, in the editor or from any MCP client. No time estimate
// is given: that number was never measured, and MESSAGING.md §4 is explicit
// that an unmeasured specific figure does more damage than good.
const STEPS = [
  { n: '01', title: 'Bring your keys', body: 'Connect your own OpenAI, Anthropic, Deepgram, ElevenLabs and Twilio keys — once. Vonod never marks up a token, a minute, or a call; the provider bills you directly.' },
  { n: '02', title: 'Describe the agent', body: 'Say what the call should do, in a sentence. Vonod lays out the graph — nodes, branches, tool calls, variables — and you refine it by asking for changes, not by dragging boxes. Works from the editor, or from Claude Desktop over MCP.' },
  { n: '03', title: 'Give it a list, or a number', body: 'Drop in a CSV to dial outbound, or assign a phone number to answer inbound. Hit go and watch outcomes stream in per call.' },
];

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-canvas text-body-strong font-sans antialiased overflow-x-hidden">
      <SiteStyles />

      <SiteHeader current="/" />

      {/* ── Hero ──────────────────────────────────────────────────────────
          No product above the fold: the claim, at the largest size on the
          page, and one button.

          The previous H1 was "Deploy agents. / No demo needed." Both halves
          were replaced, for reasons worth recording so they don't come back:

          - "No demo needed" collided with the product. Four hundred pixels
            below it the flagship widget is an agent BOOKING A DEMO — the
            contact's goal is literally goal="Book a demo" and the tool call
            is book_appointment. The single largest line on the site said the
            opposite of what the demo underneath it showed, and the subhead
            then said "No demo" a second time.
          - "Deploy agents" was DevOps vocabulary that appears nowhere else on
            this site, and never said what the agents do.

          What replaces it is the spine the rest of the site already runs on:
          you describe the call, Vonod builds the agent and runs it. That line
          is now the canvas prompt, step 02, the voice-agents page and the MCP
          page, so the hero finally says the same thing they do.

          The anti-sales-gate point that "No demo needed" carried is not lost:
          it survives under the buttons and in the closing CTA, minus the word
          "demo" that caused the collision. The billing wedge stays in the
          subhead rather than the headline (MESSAGING.md §4 flags that
          trade-off explicitly). The globe is the floor, not the backdrop (see
          GlobeBackground), so nothing sits on top of the copy. */}
      {/* The globe is anchored to this section's bottom edge, so the section
          has to end where the first screen does — otherwise the horizon
          scrolls off below the fold. 4rem is the nav. */}
      <section className="relative overflow-hidden flex min-h-[calc(100svh-4rem)]">
        <div className="lp-glow" aria-hidden="true" />
        <GlobeBackground />
        <div className="relative z-10 w-full max-w-content mx-auto px-6 pt-xxl pb-section md:py-xxl flex flex-col items-center justify-center text-center">
          {/* Matches the primary search phrase in index.html's <title> and
              <meta name="description"> verbatim (MESSAGING.md §6), so the
              term a visitor searched for is the first thing they read here. */}
          <div data-reveal className="reveal flex items-center gap-3 mb-xl">
            <span className="w-7 h-px bg-hairline-strong" aria-hidden="true" />
            <span className="text-caption-uppercase uppercase text-muted">AI phone agents</span>
            <span className="w-7 h-px bg-hairline-strong" aria-hidden="true" />
          </div>

          <h1 data-reveal className="reveal font-medium mb-xl text-display-lg sm:text-display-xl md:text-[5.5rem] lg:text-[8.75rem] leading-[1.05] tracking-[-0.03em]" style={{ transitionDelay: '60ms' }}>
            <span className="block">Describe the call.</span>
            {/* Outlined, not transparent: the surface-card-elevated fill means
                that if the stroke fails to paint anywhere, the word degrades to
                a dark embossed one instead of vanishing outright. */}
            <span className="block text-surface-card-elevated lp-outline">Vonod runs it.</span>
          </h1>

          <p data-reveal className="reveal text-title-md text-body max-w-[40rem] mb-xxl text-pretty" style={{ transitionDelay: '120ms' }}>
            Say what the call should do and Vonod builds the voice agent — then runs it across
            thousands of contacts, inbound and outbound. Bring your own OpenAI, Deepgram,
            ElevenLabs and Twilio keys. We never mark up the AI.
          </p>

          <div data-reveal className="reveal flex flex-col items-center gap-base" style={{ transitionDelay: '180ms' }}>
            <a href={APP_URL} className="btn-primary btn-lg group">
              Launch your first campaign <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#how" className="group inline-flex items-center gap-1.5 text-nav-link text-body hover:text-body-strong transition-colors">
              or see how it works <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            {/* What "No demo needed." used to carry, minus the word that
                collided with the demo widget below. */}
            <p className="mt-xs font-mono text-[0.6875rem] text-muted">
              No sales call · no commitment · your keys, your bill
            </p>
          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────────────────
          Was "Runs on your stack" — an integration list, which undersold the
          fact that these logos are the whole BYOK claim. Reframed per
          MESSAGING.md §5 point 2: not a logo wall, proof of "your keys, your
          bill." */}
      <section className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-caption font-medium text-body">
          <span className="uppercase tracking-widest text-[0.625rem]">Your keys, your bill —</span>
          {['OpenAI', 'Anthropic', 'Deepgram', 'ElevenLabs', 'Twilio', 'SIP'].map((b) => (
            <span key={b} className="font-mono text-body-strong/80">{b}</span>
          ))}
        </div>
      </section>

      {/* ── The product ───────────────────────────────────────────────────
          The hero makes the claim; this is the evidence, one section below the
          fold. A visitor watches an agent take a call, get interrupted,
          recover, and book the meeting. */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[46rem] mx-auto">
          <p className="flex items-center justify-center gap-2 mb-lg text-caption-uppercase uppercase text-body">
            <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
            Simulated call · one of thousands in a run
          </p>
          <LiveTranscript />
        </div>
      </section>

      {/* ── Where to go next ────────────────────────────────────────
          The canvas and the MCP surface used to sit here in full, on top of
          the call demo, the feature grid, the run stats and the steps. Six
          product arguments on one page meant none of them landed. Each now
          has a page; this is the junction. */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[46rem] mb-12">
          <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-base">Three pieces, one system.</h2>
          <p className="text-body text-body-md">
            An agent decides what happens inside a call. A campaign decides who gets called and
            what happens after. Vonod MCP lets you drive both without opening Vonod.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PILLARS.map((p, i) => (
            <a key={p.href} href={p.href} data-reveal
               className="reveal group card p-7 flex flex-col hover:border-hairline-strong hover:-translate-y-1 transition-all duration-300"
               style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-surface-card-elevated border border-hairline flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <p.icon size={20} />
              </div>
              <h3 className="font-medium text-title-md mb-2">{p.title}</h3>
              <p className="text-body-sm text-body mb-lg">{p.body}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 text-body-sm font-medium text-body-strong">
                {p.cta} <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          ))}
        </div>
      </section>


      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-2xl mb-14">
          <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-base">Built for volume from day one.</h2>
          <p className="text-body text-body-md">Every feature designed to operate at campaign scale — thousands of simultaneous calls, each one individually intelligent.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} data-reveal className="reveal group p-7 card hover:border-hairline-strong hover:-translate-y-1 transition-all duration-300" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-surface-card-elevated border border-hairline flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <f.icon size={20} />
              </div>
              <h3 className="font-medium text-title-md mb-2">{f.title}</h3>
              <p className="text-body-sm text-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scale ────────────────────────────────────────
          The hero shows one call. This band shows what a whole run of them
          looks like — the numbers the old hero card was faking, set as type
          and labelled as the illustration they are. */}
      <section id="scale" className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-xxl md:py-section grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div data-reveal className="reveal">
            <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-base">Every call is individual. Every campaign is massive.</h2>
            <p className="text-body text-body-md mb-lg">
              While your campaign dials thousands, each conversation is an intelligent, context-aware interaction. No scripts. No templates. Every person gets a real conversation, with real branching based on what they say.
            </p>
            <a href={APP_URL} className="group inline-flex items-center gap-2 font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
              Launch a campaign <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <div data-reveal className="reveal" style={{ transitionDelay: '120ms' }}>
            <p className="text-caption-uppercase uppercase text-body mb-lg">A typical 5,000-contact run</p>
            <dl className="grid grid-cols-2 gap-x-12 gap-y-xl">
              {/* Source order is label → value → note, which is what a screen
                  reader should hear. `order` flips it visually so the number
                  leads. */}
              {RUN_STATS.map(({ v, k, note }) => (
                <div key={k} className="flex flex-col">
                  <dt className="order-2 mt-1.5 text-caption-uppercase uppercase text-body-strong">{k}</dt>
                  <dd className="order-1 font-mono text-display-md lg:text-display-lg font-medium tabular-nums">{v}</dd>
                  <dd className="order-3 mt-1 text-body-sm text-body">{note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how" className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-base">From a sentence to a live campaign.</h2>
          <p className="text-body text-body-md">Describe the agent you want, connect your own provider keys, and point it at a list or a phone number. The graph builds itself as you talk.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} data-reveal className="reveal relative" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="font-mono text-display-xl font-medium text-muted-soft mb-lg">{s.n}</div>
              <h3 className="font-medium text-display-sm mb-2">{s.title}</h3>
              <p className="text-body-sm text-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 pb-24">
        <div data-reveal className="reveal spotlight relative overflow-hidden card px-xl py-xxl md:py-section text-center">
          <div className="relative">
            <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-md">Your first 5,000 calls are one click away.</h2>
            <p className="text-body text-body-md max-w-xl mx-auto mb-xl">
              Describe the agent, point it at a list, and launch. No sales call. No commitment.
            </p>
            <a href={APP_URL} className="btn-primary btn-lg group">
              Launch a campaign free <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
