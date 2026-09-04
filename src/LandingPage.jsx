import { useEffect, useRef, useState } from 'react';
import {
  Radio, Globe, Gauge, Target, Group, Timer,
  ArrowRight, Check, PhoneCall, ChevronRight, TrendingUp, Zap, Bot, User,
  CalendarCheck, Database, MessageSquare,
} from 'lucide-react';
import GlobeBackground from './components/GlobeBackground';

/**
 * Vonod marketing landing — standalone static site (its own app, decoupled from
 * the platform). Brand-aligned (vonod-* tokens, Inter, JetBrains Mono, rounded,
 * monochromatic, light+dark) and elevated: animated hero orb + 3D dot globe, a
 * self-typing live-transcript demo, scroll-reveal sections. CSS-only motion,
 * disabled under prefers-reduced-motion. CTAs point at the app (VITE_APP_URL).
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
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const SPEAKERS = {
  agent: { name: 'Agent', role: 'AI', color: '#818cf8', rgb: [129, 140, 248], Icon: Bot },     // indigo
  user: { name: 'Marcos', role: 'Contact', color: '#34d399', rgb: [52, 211, 153], Icon: User }, // emerald
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
    <div ref={rootRef} className="rounded-2xl border border-vonod-border bg-vonod-card overflow-hidden shadow-xl">
      {/* Header — campaign progress + a single latency badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-vonod-border">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-vonod-secondary">Live call · 2,417 / 5,000</span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-vonod-secondary">
          <span className="inline-flex items-center gap-1 text-vonod-primary"><Zap size={11} /> {AVG_REPLY} reply</span>
          <span>00:14</span>
        </span>
      </div>

      {/* Contact — the per-call input variables, condensed */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-vonod-border">
        <span className="w-8 h-8 rounded-lg bg-vonod-surface border border-vonod-border flex items-center justify-center text-[11px] font-semibold text-vonod-primary shrink-0">
          {CONTACT.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-vonod-primary truncate">
            {CONTACT.name} <span className="text-vonod-secondary font-normal">· {CONTACT.company}</span>
          </div>
          <div className="font-mono text-[10px] text-vonod-secondary truncate">{CONTACT.vars}</div>
        </div>
        <span className="font-mono text-[10px] text-vonod-secondary px-1.5 py-0.5 rounded bg-vonod-surface border border-vonod-border shrink-0">
          call · {CONTACT.varCount} vars
        </span>
      </div>

      {/* ONE call waveform — both voices on the same mic, two colours at once */}
      <div className="px-4 pt-3 pb-2.5 border-b border-vonod-border">
        <div className="flex items-center gap-3 mb-2">
          {['agent', 'user'].map((w) => {
            const s = SPEAKERS[w];
            return (
              <span key={w} ref={(el) => { chipRef.current[w] = el; }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium transition-opacity duration-150"
                style={{ color: s.color, opacity: 0.32 }}>
                <s.Icon size={13} /> {s.name}
              </span>
            );
          })}
          <span ref={capRef} className="ml-auto text-[10px] uppercase tracking-wider text-vonod-secondary">Listening…</span>
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
                <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <Zap size={11} /> both speaking — agent yields the floor
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-semibold mt-1 shrink-0 w-12 text-right" style={{ color: s.color }}>{s.name}</span>
                <p className="flex-1 text-sm leading-relaxed text-vonod-primary">
                  {text}{isActive && !done && <span className="lp-caret" style={{ background: s.color }} />}{done && line.cut && <span className="text-vonod-secondary"> ⏸</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions — the agent works across your tools, not just one */}
      <div className="px-4 py-3 border-t border-vonod-border">
        <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-vonod-secondary">
          <Zap size={11} /> Takes action across your tools
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a, i) => {
            const st = actStates[i];
            const active = st >= 1;
            const isDone = st >= 2;
            return (
              <div key={a.id}
                className={`rounded-xl border px-2.5 py-2 transition-all duration-300 ${active ? 'border-vonod-border-hover bg-vonod-surface/60' : 'border-vonod-border opacity-55'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <a.Icon size={13} className={isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-vonod-primary'} />
                  {isDone ? <Check size={11} className="ml-auto text-emerald-600 dark:text-emerald-400" />
                    : active ? <span className="lp-dot ml-auto" /> : null}
                </div>
                <div className="text-[10px] font-medium text-vonod-primary leading-tight truncate">{a.label}</div>
                <div className="font-mono text-[9px] text-vonod-secondary truncate">{a.fn}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-4 text-[11px] text-vonod-secondary flex items-center gap-1.5">
          {latestMsg && (
            <span className="lp-line inline-flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> {latestMsg}
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

const STEPS = [
  { n: '01', title: 'Upload & segment', body: 'Import your contact list in CSV, segment by time zone, priority, or custom tags. Vonod handles dedup and validation.' },
  { n: '02', title: 'Design your campaign', body: 'Pick the agent, set the opening line, define outcomes, and configure retry logic — all from a single flow.' },
  { n: '03', title: 'Launch at scale', body: 'Hit go. Thousands of concurrent calls, each one an individual conversation. Watch outcomes stream live.' },
];

export default function LandingPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-vonod-bg text-vonod-primary font-sans antialiased overflow-x-hidden">
      <LandingStyles />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-vonod-bg/70 border-b border-vonod-border/60">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={asset('logo_negro_vonod.png')} alt="Vonod" className="w-7 h-7 object-contain dark:hidden" />
            <img src={asset('logo_blanco_vonod.png')} alt="Vonod" className="w-7 h-7 object-contain hidden dark:block" />
            <span className="font-semibold tracking-tight text-lg">Vonod</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-vonod-secondary">
            <a href="#features" className="hover:text-vonod-primary transition-colors">Platform</a>
            <a href="#how" className="hover:text-vonod-primary transition-colors">How it works</a>
            <a href="#demo" className="hover:text-vonod-primary transition-colors">Live campaign</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={APP_URL} className="px-4 py-2 text-sm font-medium text-vonod-secondary hover:text-vonod-primary transition-colors rounded-full">
              Log in
            </a>
            <a href={APP_URL} className="group px-4 py-2 text-sm font-medium bg-vonod-primary text-vonod-bg rounded-full hover:opacity-90 transition-all flex items-center gap-1.5">
              Get started
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="lp-orb" aria-hidden="true" />
        <div className="lp-grid" aria-hidden="true" />
        <GlobeBackground />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span data-reveal className="reveal inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-vonod-border bg-vonod-surface/60 text-xs font-medium text-vonod-secondary mb-6">
              <TrendingUp size={13} /> AI phone campaigns at scale
            </span>
            <h1 data-reveal className="reveal text-4xl md:text-6xl font-medium tracking-tighter leading-[1.05] mb-6" style={{ transitionDelay: '60ms' }}>
              Dial millions.<br />Not one at a time.
            </h1>
            <p data-reveal className="reveal text-lg text-vonod-secondary leading-relaxed max-w-md mb-8" style={{ transitionDelay: '120ms' }}>
              Vonod runs massive outbound phone campaigns — thousands of concurrent AI-powered calls, with the intelligence to handle each conversation individually.
            </p>
            <div data-reveal className="reveal flex flex-wrap items-center gap-3" style={{ transitionDelay: '180ms' }}>
              <a href={APP_URL} className="group px-6 py-3.5 bg-vonod-primary text-vonod-bg font-medium rounded-full hover:opacity-90 transition-all flex items-center gap-2">
                Launch your first campaign <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#demo" className="px-6 py-3.5 border border-vonod-border rounded-full font-medium hover:border-vonod-border-hover hover:bg-vonod-surface/50 transition-all flex items-center gap-2">
                <PhoneCall size={17} /> See it in action
              </a>
            </div>
            <div data-reveal className="reveal flex items-center gap-6 mt-10 text-xs text-vonod-secondary" style={{ transitionDelay: '240ms' }}>
              <span className="flex items-center gap-1.5"><Check size={14} /> Thousands concurrent</span>
              <span className="flex items-center gap-1.5"><Check size={14} /> No code</span>
              <span className="flex items-center gap-1.5"><Check size={14} /> Sub-second per call</span>
            </div>
          </div>

          <div data-reveal className="reveal lp-float relative" style={{ transitionDelay: '160ms' }}>
            <div className="rounded-3xl border border-vonod-border bg-vonod-card shadow-2xl p-6">
              {/* Campaign header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-vonod-primary flex items-center justify-center p-2.5">
                  <img src={asset('logo_blanco_vonod.png')} alt="Vonod" className="w-full h-full object-contain dark:hidden" />
                  <img src={asset('logo_negro_vonod.png')} alt="Vonod" className="w-full h-full object-contain hidden dark:block" />
                </div>
                <div>
                  <div className="font-medium text-sm">Q2 Outreach · Active</div>
                  <div className="text-xs text-vonod-secondary">1,247 calls completed today</div>
                </div>
                <span className="ml-auto text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live · 312 concurrent
                </span>
              </div>
              {/* Mini metrics row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  ['Connect', '38.2%'],
                  ['Booked', '12.7%'],
                  ['Avg cost', '$0.14'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-vonod-border bg-vonod-surface/50 py-2 px-2.5 text-center">
                    <div className="font-mono text-sm font-medium">{v}</div>
                    <div className="text-[10px] uppercase tracking-wider text-vonod-secondary mt-0.5">{k}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-vonod-secondary mb-1.5">
                  <span>Progress · 1,247 / 5,000</span>
                  <span>24.9%</span>
                </div>
                <div className="h-1.5 rounded-full bg-vonod-surface overflow-hidden">
                  <div className="h-full w-[24.9%] rounded-full bg-vonod-primary transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-vonod-secondary">
                <span>Avg turn-around: 0.7s</span>
                <span>Est. completion: 2h 14m</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────── */}
      <section className="border-y border-vonod-border/60 bg-vonod-surface/30">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-vonod-secondary">
          <span className="uppercase tracking-widest text-[10px]">Runs on your stack</span>
          {['OpenAI', 'Anthropic', 'Deepgram', 'ElevenLabs', 'Twilio', 'SIP'].map((b) => (
            <span key={b} className="font-mono text-vonod-primary/80">{b}</span>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div data-reveal className="reveal max-w-2xl mb-14">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter mb-4">Built for volume from day one.</h2>
          <p className="text-vonod-secondary text-lg">Every feature designed to operate at campaign scale — thousands of simultaneous calls, each one individually intelligent.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} data-reveal className="reveal group p-6 rounded-2xl border border-vonod-border bg-vonod-card hover:border-vonod-border-hover hover:-translate-y-1 transition-all duration-300" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-vonod-surface border border-vonod-border flex items-center justify-center mb-4 group-hover:bg-vonod-primary group-hover:text-vonod-bg transition-colors">
                <f.icon size={20} />
              </div>
              <h3 className="font-medium text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-sm text-vonod-secondary leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live campaign demo ───────────────────────────────────────── */}
      <section id="demo" className="border-y border-vonod-border/60 bg-vonod-surface/30">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div data-reveal className="reveal">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-vonod-secondary mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live call — one of thousands
            </span>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter mb-4">Every call is individual. Every campaign is massive.</h2>
            <p className="text-vonod-secondary text-lg leading-relaxed mb-6">
              While your campaign dials thousands, each conversation is an intelligent, context-aware interaction. No scripts. No templates. Every person gets a real conversation, with real branching based on what they say.
            </p>
            <a href={APP_URL} className="group inline-flex items-center gap-2 font-medium hover:gap-3 transition-all">
              Launch a campaign <ChevronRight size={18} />
            </a>
          </div>
          <div data-reveal className="reveal" style={{ transitionDelay: '120ms' }}>
            <LiveTranscript />
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div data-reveal className="reveal text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter mb-4">From list to launch in minutes.</h2>
          <p className="text-vonod-secondary text-lg">Upload your contacts, configure the campaign, and let Vonod dial while you watch the results stream in.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} data-reveal className="reveal relative" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="font-mono text-5xl font-medium text-vonod-border-hover mb-4">{s.n}</div>
              <h3 className="font-medium text-xl mb-2 tracking-tight">{s.title}</h3>
              <p className="text-sm text-vonod-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div data-reveal className="reveal relative overflow-hidden rounded-3xl border border-vonod-border bg-vonod-card px-8 py-16 md:py-20 text-center">
          <div className="lp-orb lp-orb-cta" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tighter mb-5">Your first 5,000 calls are one click away.</h2>
            <p className="text-vonod-secondary text-lg max-w-xl mx-auto mb-8">
              Upload a list, configure your agent, and launch. No sales call. No demo. No commitment.
            </p>
            <a href={APP_URL} className="group px-7 py-4 bg-vonod-primary text-vonod-bg font-medium rounded-full hover:opacity-90 transition-all inline-flex items-center gap-2">
              Launch a campaign free <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-vonod-border/60">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-vonod-secondary">
          <div className="flex items-center gap-2.5">
            <img src={asset('logo_negro_vonod.png')} alt="" className="w-6 h-6 object-contain dark:hidden" />
            <img src={asset('logo_blanco_vonod.png')} alt="" className="w-6 h-6 object-contain hidden dark:block" />
            <span className="font-medium text-vonod-primary">Vonod</span>
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

      .lp-orb { position:absolute; top:-180px; left:50%; transform:translateX(-50%); width:680px; height:680px; border-radius:9999px; pointer-events:none; z-index:0;
        background: radial-gradient(circle, color-mix(in srgb, var(--text-primary) 12%, transparent) 0%, transparent 62%);
        filter: blur(20px); animation: lp-breathe 9s ease-in-out infinite; }
      .lp-orb-cta { top:auto; bottom:-300px; width:520px; height:520px; opacity:.7; }
      .lp-grid { position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.5;
        background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
        background-size: 56px 56px;
        -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%);
        mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%); }

      @keyframes lp-breathe { 0%,100%{ transform:translateX(-50%) scale(1); opacity:.85 } 50%{ transform:translateX(-50%) scale(1.12); opacity:1 } }

      .lp-float { animation: lp-float 6s ease-in-out infinite; }
      @keyframes lp-float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-12px) } }

      .lp-line { animation: lp-line .45s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes lp-line { from{ opacity:0; transform:translateY(8px) } to{ opacity:1; transform:none } }

      /* One shared call waveform — both voices on the same mic. Each bar carries
         BOTH speaker colours at once, split vertically at --p (agent share at the
         bottom, contact on top), updated per frame. Bars grow from the centre. */
      .cw { display:flex; align-items:center; gap:2px; height:56px; }
      .cw i { flex:1 1 0; min-width:2px; max-width:6px; height:6%; border-radius:3px; will-change:height;
        background: linear-gradient(to top, var(--ca, #818cf8) var(--p, 50%), var(--cb, #34d399) var(--p, 50%)); }

      /* Tiny pulsing dot for an in-flight tool call. */
      .lp-dot { width:5px; height:5px; border-radius:9999px; background: var(--text-primary); animation: lp-dot 1s ease-in-out infinite; }
      @keyframes lp-dot { 0%,100%{ opacity:.3 } 50%{ opacity:1 } }

      /* Steady (non-blinking) streaming cursor while a line is being spoken. */
      .lp-caret { display:inline-block; width:2px; height:0.95em; margin-left:2px; vertical-align:-1px; border-radius:1px; opacity:.75; }

      @media (prefers-reduced-motion: reduce) {
        .lp-orb, .lp-float, .lp-dot { animation: none !important; }
        [data-reveal].reveal { opacity:1 !important; transform:none !important; transition:none !important; }
      }
    `}</style>
  );
}
