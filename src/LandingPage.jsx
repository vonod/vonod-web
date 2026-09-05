import { useEffect, useRef, useState } from 'react';
import {
  Radio, Globe, Gauge, Target, Group, Timer,
  ArrowRight, Check, ChevronRight, Zap, Bot, User,
  CalendarCheck, Database, MessageSquare,
} from 'lucide-react';
import GlobeBackground from './components/GlobeBackground';

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
 * The entire page sells one thing: massive phone campaigns at scale.
 * Not "agents." Campaigns. Volume. Concurrency. Outcomes.
 */

const APP_URL = import.meta.env.VITE_APP_URL || 'https://vonod-frontend.fly.dev';

// Vite rewrites absolute asset URLs inside index.html but not runtime strings
// in JSX, so public/ assets have to carry the base path themselves — the site
// is served from /vonod-web/ on GitHub Pages, not from the domain root.
const asset = (name) => `${import.meta.env.BASE_URL}${name}`;

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Two voices, told apart by weight rather than hue: the agent is ink, the
// contact is muted. Colour was never the only signal — every line carries the
// speaker's name and icon — and both values clear 4.5:1 on the card surface
// (19:1 and 5:1), which matters at the 11px the speaker label runs at.
const SPEAKERS = {
  agent: { name: 'Agent', role: 'AI', color: 'var(--color-ink)', Icon: Bot },
  user: { name: 'Marcos', role: 'Contact', color: 'var(--color-muted)', Icon: User },
};

// The "call" object — the per-contact input variables this run is fed. The agent
// reads from these (greets Marcos by name, books in his timezone, etc.).
const CONTACT = {
  name: 'Marcos Ruiz',
  company: 'Northwind Labs',
  initials: 'MR',
  vars: 'tz="Europe/Madrid" · goal="Book a demo"',
  varCount: 5,
};
const AVG_REPLY = '0.7s';

// Tools the agent can call. During the demo it uses all three in sequence —
// books the meeting, logs the outcome to the CRM, texts a confirmation — so the
// widget shows breadth, not a single canned action.
const ACTIONS = [
  { id: 'cal', label: 'Google Calendar', fn: 'book_appointment', Icon: CalendarCheck, at: 11.8, end: 12.6, busy: 'Booking the demo…', done: 'Demo booked · Fri 10:00' },
  { id: 'crm', label: 'HubSpot CRM', fn: 'log_outcome', Icon: Database, at: 12.8, end: 13.6, busy: 'Updating the CRM…', done: 'Outcome logged · Meeting booked' },
  { id: 'sms', label: 'Twilio SMS', fn: 'send_confirmation', Icon: MessageSquare, at: 13.8, end: 14.6, busy: 'Texting confirmation…', done: 'Confirmation sent to Marcos' },
];

// One call, on a single timeline (seconds). Both voices share ONE line — like a
// real phone call where the mic carries everyone — and they OVERLAP during the
// barge-in (user starts at 6.4 while the agent runs until 6.9 → both at once).
const CALL = [
  { who: 'agent', start: 0.3, end: 3.0, text: 'Hi Marcos! Vonod assistant here, from Northwind. Is now a good time?' },
  { who: 'user', start: 3.3, end: 4.6, text: 'Sure, but keep it short.' },
  { who: 'agent', start: 4.9, end: 6.9, text: 'Of course — I can book your demo for Thursday at 10—', cut: true },
  { who: 'user', start: 6.4, end: 8.1, text: 'Actually, Friday works better.', barge: true },  // overlaps the agent
  { who: 'agent', start: 8.5, end: 11.0, text: 'Perfect — Friday at 10. Let me set that up.' },
];
const CALL_LOOP = 16.5;     // seconds before the demo restarts

const N_BARS = 40;
// Per-bar spectral weight — fuller in the middle (formant-ish), with a stable
// per-bar wobble so the line isn't a clean arch.
const SPEC = Array.from({ length: N_BARS }, (_, i) => {
  const x = i / (N_BARS - 1);
  return (0.45 + 0.55 * Math.sin(Math.PI * x)) * (0.78 + 0.22 * Math.sin(i * 12.9898));
});

// Speech envelope for a speaker at time t: phrase-level pauses + ~5 Hz syllables.
function speechEnv(t, seed) {
  const phrase = Math.sin(t * 1.35 + seed);
  const gate = phrase > -0.22 ? 1 : 0.05;
  const syl = Math.abs(Math.sin(t * Math.PI * 4.6 + seed));
  return gate * (0.16 + 0.84 * syl);
}
// How loud a given speaker is at time t (0 when not in one of their utterances).
function levelFor(who, t) {
  let act = 0;
  for (const u of CALL) {
    if (u.who !== who) continue;
    if (t >= u.start && t <= u.end) {
      const edge = 0.18;
      act = Math.min(1, (t - u.start) / edge, (u.end - t) / edge);
      break;
    }
  }
  if (act <= 0) return 0;
  return act * speechEnv(t, who === 'agent' ? 1.3 : 7.7);
}

function LiveTranscript() {
  // Transcript state is updated at most a few times/sec (word boundaries); the
  // waveform/colour/caption are written straight to the DOM every frame (refs).
  const [tx, setTx] = useState({ vis: 0, actIdx: -1, actWords: 0, acts: '000' });
  const rootRef = useRef(null);
  const barsRef = useRef([]);
  const waveRef = useRef(null);
  const capRef = useRef(null);
  const chipRef = useRef({});

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const bars = barsRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTx({ vis: CALL.length, actIdx: -1, actWords: 0, acts: '222' });
      bars.forEach((b, i) => { if (b) b.style.height = `${20 + SPEC[i] * 45}%`; });
      return undefined;
    }

    let raf = 0;
    let start = 0;
    const cur = new Array(N_BARS).fill(0.06);
    let lastKey = '';

    const frame = (now) => {
      if (!start) start = now;
      const t = ((now - start) / 1000) % CALL_LOOP;
      const la = levelFor('agent', t);
      const lu = levelFor('user', t);
      const sum = la + lu;
      const both = la > 0.06 && lu > 0.06;

      // ONE mic, TWO voices: every bar carries both colours at once, split by
      // who is loud right now (agent share at the bottom, contact on top). Just
      // one --p drives all bars, so it stays cheap.
      const share = sum > 0.001 ? la / sum : 0.5;
      if (waveRef.current) waveRef.current.style.setProperty('--p', `${(share * 100).toFixed(1)}%`);

      // One shared waveform = the line audio (both voices summed), with an
      // ambient noise floor so the mic is never perfectly dead (quiet ≠ flat).
      const amp = Math.min(1.2, sum * (both ? 1.15 : 1));
      const quiet = 1 - Math.min(1, sum * 2);
      for (let i = 0; i < N_BARS; i++) {
        const flick = 0.4 + 0.6 * Math.abs(Math.sin(t * (6 + i * 0.55) + i));
        let target = amp * SPEC[i] * flick;
        if (both) target += 0.12 * Math.abs(Math.sin(t * (9 + i) + i * 3)); // messier when both talk
        if (Math.sin(t * (2.7 + i) + i * 2) > 0.9) target *= 0.25;          // dropouts
        const noise = (0.05 + 0.05 * Math.abs(Math.sin(t * (5 + i * 0.7) + i))) * (0.2 + 0.8 * quiet);
        target = Math.max(noise, Math.min(1, target));
        cur[i] += (target - cur[i]) * 0.45;
        const b = bars[i];
        if (b) b.style.height = `${6 + cur[i] * 90}%`;
      }

      // Speaker chips + caption (DOM, no re-render).
      if (chipRef.current.agent) chipRef.current.agent.style.opacity = la > 0.06 ? '1' : '0.32';
      if (chipRef.current.user) chipRef.current.user.style.opacity = lu > 0.06 ? '1' : '0.32';
      if (capRef.current) {
        capRef.current.textContent = both ? 'Both speaking' : la > 0.06 ? 'Agent speaking' : lu > 0.06 ? 'Marcos speaking' : 'Listening…';
      }

      // Transcript: visible utterances + word-streaming for the talking one.
      let vis = 0; let actIdx = -1; let actWords = 0;
      for (let i = 0; i < CALL.length; i++) {
        const u = CALL[i];
        if (t >= u.start) {
          vis = i + 1;
          const total = u.text.split(' ').length;
          if (t <= u.end) {
            actIdx = i;
            actWords = Math.min(total, Math.max(1, Math.round(((t - u.start) / (u.end - u.start)) * total)));
          }
        }
      }
      // Tool calls: per action 0 idle · 1 calling · 2 done (packed as a string).
      const acts = ACTIONS.map((a) => (t >= a.end ? 2 : t >= a.at ? 1 : 0)).join('');

      const key = `${vis}:${actIdx}:${actWords}:${acts}`;
      if (key !== lastKey) { lastKey = key; setTx({ vis, actIdx, actWords, acts }); }

      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(raf); raf = 0; start = 0; }
    }, { threshold: 0.3 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // Latest tool result to surface as a single status line under the rail.
  const actStates = tx.acts.split('').map(Number);
  let latest = -1;
  for (let i = 0; i < actStates.length; i++) if (actStates[i] > 0) latest = i;
  const latestMsg = latest >= 0 ? (actStates[latest] >= 2 ? ACTIONS[latest].done : ACTIONS[latest].busy) : null;

  return (
    <div ref={rootRef} className="rounded-xl border border-hairline bg-surface-card overflow-hidden shadow-xl">
      {/* Header — campaign progress + a single latency badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline">
        <span className="w-2 h-2 rounded-full bg-success" />
        <span className="text-caption font-medium text-body">Call 2,417 of 5,000</span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[0.6875rem] text-body">
          <span className="inline-flex items-center gap-1 text-body-strong"><Zap size={11} /> {AVG_REPLY} reply</span>
          <span>00:14</span>
        </span>
      </div>

      {/* Contact — the per-call input variables, condensed */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-hairline">
        <span className="w-8 h-8 rounded-lg bg-surface-card-elevated border border-hairline flex items-center justify-center text-[0.6875rem] font-semibold text-body-strong shrink-0">
          {CONTACT.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-caption font-medium text-body-strong truncate">
            {CONTACT.name} <span className="text-body font-normal">· {CONTACT.company}</span>
          </div>
          <div className="font-mono text-[0.625rem] text-body truncate">{CONTACT.vars}</div>
        </div>
        <span className="font-mono text-[0.625rem] text-body px-1.5 py-0.5 rounded bg-surface-card-elevated border border-hairline shrink-0">
          call · {CONTACT.varCount} vars
        </span>
      </div>

      {/* ONE call waveform — both voices on the same mic, two colours at once */}
      <div className="px-4 pt-3 pb-2.5 border-b border-hairline">
        <div className="flex items-center gap-3 mb-2">
          {['agent', 'user'].map((w) => {
            const s = SPEAKERS[w];
            return (
              <span key={w} ref={(el) => { chipRef.current[w] = el; }}
                className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium transition-opacity duration-150"
                style={{ color: s.color, opacity: 0.32 }}>
                <s.Icon size={13} /> {s.name}
              </span>
            );
          })}
          <span ref={capRef} className="ml-auto text-caption-uppercase uppercase text-body">Listening…</span>
        </div>
        <div ref={waveRef} className="cw" style={{ '--ca': SPEAKERS.agent.color, '--cb': SPEAKERS.user.color }} aria-hidden="true">
          {Array.from({ length: N_BARS }).map((_, i) => (
            <i key={i} ref={(el) => { barsRef.current[i] = el; }} />
          ))}
        </div>
      </div>

      {/* Streamed transcript — fixed height, newest anchored to the bottom */}
      <div className="px-4 py-3 h-[150px] overflow-hidden flex flex-col justify-end gap-2">
        {CALL.slice(0, tx.vis).map((line, i) => {
          const s = SPEAKERS[line.who];
          const wordsArr = line.text.split(' ');
          const isActive = i === tx.actIdx;
          const text = isActive ? wordsArr.slice(0, tx.actWords).join(' ') : line.text;
          const done = !isActive || tx.actWords >= wordsArr.length;
          return (
            <div key={i} className="lp-line">
              {line.barge && (
                <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[0.625rem] font-medium text-error">
                  <Zap size={11} /> both speaking — agent yields the floor
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-[0.625rem] font-semibold mt-1 shrink-0 w-12 text-right" style={{ color: s.color }}>{s.name}</span>
                <p className="flex-1 text-body-sm leading-relaxed text-body-strong">
                  {text}{isActive && !done && <span className="lp-caret" style={{ background: s.color }} />}{done && line.cut && <span className="text-body"> ⏸</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions — the agent works across your tools, not just one */}
      <div className="px-4 py-3 border-t border-hairline">
        <div className="flex items-center gap-1.5 mb-2 text-caption-uppercase uppercase text-body">
          <Zap size={11} /> Takes action across your tools
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a, i) => {
            const st = actStates[i];
            const active = st >= 1;
            const isDone = st >= 2;
            return (
              <div key={a.id}
                className={`rounded-xl border px-2.5 py-2 transition-all duration-300 ${active ? 'border-hairline-strong bg-surface-card-elevated/60' : 'border-hairline opacity-55'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <a.Icon size={13} className={isDone ? 'text-success' : 'text-body-strong'} />
                  {isDone ? <Check size={11} className="ml-auto text-success" />
                    : active ? <span className="lp-dot ml-auto" /> : null}
                </div>
                <div className="text-[0.625rem] font-medium text-body-strong leading-tight truncate">{a.label}</div>
                <div className="font-mono text-[0.5625rem] text-body truncate">{a.fn}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-4 text-[0.6875rem] text-body flex items-center gap-1.5">
          {latestMsg && (
            <span className="lp-line inline-flex items-center gap-1.5">
              <Check size={12} className="text-success" /> {latestMsg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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

const STEPS = [
  { n: '01', title: 'Upload & segment', body: 'Import your contact list in CSV, segment by time zone, priority, or custom tags. Vonod handles dedup and validation.' },
  { n: '02', title: 'Design your campaign', body: 'Pick the agent, set the opening line, define outcomes, and configure retry logic — all from a single flow.' },
  { n: '03', title: 'Launch at scale', body: 'Hit go. Thousands of concurrent calls, each one an individual conversation. Watch outcomes stream live.' },
];

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-canvas text-body-strong font-sans antialiased overflow-x-hidden">
      <LandingStyles />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-canvas/80 border-b border-hairline">
        <nav className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={asset('logo_blanco_vonod.png')} alt="Vonod" className="w-7 h-7 object-contain" />
            <span className="font-semibold tracking-tight text-title-md">Vonod</span>
          </div>
          <div className="hidden md:flex items-center gap-xl text-nav-link text-body">
            <a href="#features" className="hover:text-body-strong transition-colors">Platform</a>
            <a href="#how" className="hover:text-body-strong transition-colors">How it works</a>
            <a href="#scale" className="hover:text-body-strong transition-colors">At scale</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={APP_URL} className="btn-tertiary px-base py-2.5">Log in</a>
            <a href={APP_URL} className="btn-primary group">
              Get started
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────
          No product above the fold: the claim, at the largest size on the
          page, and one button. The two halves of the pitch are carried by the
          type itself — "Call everyone." solid is the volume, "Personally." in
          outline is the individual. The globe is the floor, not the backdrop
          (see GlobeBackground), so nothing sits on top of the copy. */}
      {/* The globe is anchored to this section's bottom edge, so the section
          has to end where the first screen does — otherwise the horizon
          scrolls off below the fold. 4rem is the nav. */}
      <section className="relative overflow-hidden flex min-h-[calc(100svh-4rem)]">
        <div className="lp-glow" aria-hidden="true" />
        <GlobeBackground />
        <div className="relative z-10 w-full max-w-content mx-auto px-6 pt-xxl pb-section md:py-xxl flex flex-col items-center justify-center text-center">
          <div data-reveal className="reveal flex items-center gap-3 mb-xl">
            <span className="w-7 h-px bg-hairline-strong" aria-hidden="true" />
            <span className="text-caption-uppercase uppercase text-muted">AI phone campaigns</span>
            <span className="w-7 h-px bg-hairline-strong" aria-hidden="true" />
          </div>

          <h1 data-reveal className="reveal font-medium mb-xl text-display-lg sm:text-display-xl md:text-[5.5rem] lg:text-[8.75rem] leading-[1.05] tracking-[-0.03em]" style={{ transitionDelay: '60ms' }}>
            <span className="block">Call everyone.</span>
            {/* Outlined, not transparent: the surface-card-elevated fill means
                that if the stroke fails to paint anywhere, the word degrades to
                a dark embossed one instead of vanishing outright. */}
            <span className="block text-surface-card-elevated lp-outline">Personally.</span>
          </h1>

          <p data-reveal className="reveal text-title-md text-body max-w-[40rem] mb-xxl text-pretty" style={{ transitionDelay: '120ms' }}>
            Vonod dials thousands of numbers at once and holds a real conversation on every one — it listens, handles the interruption, and books the meeting itself.
          </p>

          <div data-reveal className="reveal flex flex-col items-center gap-base" style={{ transitionDelay: '180ms' }}>
            <a href={APP_URL} className="btn-primary btn-lg group">
              Launch your first campaign <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#how" className="group inline-flex items-center gap-1.5 text-nav-link text-body hover:text-body-strong transition-colors">
              or see how it works <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────── */}
      <section className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-caption font-medium text-body">
          <span className="uppercase tracking-widest text-[0.625rem]">Runs on your stack</span>
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
          <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-base">From list to launch in minutes.</h2>
          <p className="text-body text-body-md">Upload your contacts, configure the campaign, and let Vonod dial while you watch the results stream in.</p>
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
              Upload a list, configure your agent, and launch. No sales call. No demo. No commitment.
            </p>
            <a href={APP_URL} className="btn-primary btn-lg group">
              Launch a campaign free <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-hairline">
        <div className="max-w-content mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-body">
          <div className="flex items-center gap-2.5">
            <img src={asset('logo_blanco_vonod.png')} alt="" className="w-6 h-6 object-contain" />
            <span className="font-medium text-body-strong">Vonod</span>
          </div>
          <p>© {new Date().getFullYear()} Vonod. AI phone campaigns at scale.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingStyles() {
  return (
    <style>{`
      [data-reveal].reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
      [data-reveal].reveal.in { opacity: 1; transform: none; }

      /* A still wash of light off the near-black floor, behind the hero.
         It does not pulse — a header that breathes reads as a consumer
         landing page, and this one is selling to operations teams. */
      .lp-glow { position:absolute; top:-220px; left:50%; transform:translateX(-50%); width:900px; height:760px; pointer-events:none; z-index:0;
        background: radial-gradient(ellipse at center,
          color-mix(in srgb, var(--color-ink) 9%, transparent) 0%,
          color-mix(in srgb, var(--color-ink) 4%, transparent) 36%,
          transparent 68%);
        filter: blur(50px); }

      /* The outlined half of the headline. The fill is surface-card-elevated,
         not transparent, so the word degrades to a dark embossed one rather
         than disappearing if a renderer ever drops the stroke. */
      .lp-outline { -webkit-text-stroke: 1.5px var(--color-ink); }

      .lp-line { animation: lp-line .45s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes lp-line { from{ opacity:0; transform:translateY(8px) } to{ opacity:1; transform:none } }

      /* One shared call waveform — both voices on the same mic. Each bar carries
         BOTH speaker colours at once, split vertically at --p (agent share at the
         bottom, contact on top), updated per frame. Bars grow from the centre. */
      .cw { display:flex; align-items:center; gap:2px; height:56px; }
      .cw i { flex:1 1 0; min-width:2px; max-width:6px; height:6%; border-radius:3px; will-change:height;
        background: linear-gradient(to top, var(--ca) var(--p, 50%), var(--cb) var(--p, 50%)); }

      /* Tiny pulsing dot for an in-flight tool call. */
      .lp-dot { width:5px; height:5px; border-radius:9999px; background: var(--color-ink); animation: lp-dot 1s ease-in-out infinite; }
      @keyframes lp-dot { 0%,100%{ opacity:.3 } 50%{ opacity:1 } }

      /* Steady (non-blinking) streaming cursor while a line is being spoken. */
      .lp-caret { display:inline-block; width:2px; height:0.95em; margin-left:2px; vertical-align:-1px; border-radius:1px; opacity:.75; }

      @media (prefers-reduced-motion: reduce) {
        .lp-dot { animation: none !important; }
        [data-reveal].reveal { opacity:1 !important; transform:none !important; transition:none !important; }
      }
    `}</style>
  );
}
