import { useEffect, useRef, useState } from 'react';
import { Zap, Bot, User, Check, CalendarCheck, Database, MessageSquare } from 'lucide-react';

// One simulated call, extracted from LandingPage when the site grew past a
// single page — /voice-agents/ needs the same widget and a component cannot
// live inside the page that used to be the whole site.

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
// The call now ENDS rather than cutting. Previously the timeline wrapped
// straight from the last tool call back to frame zero, so the transcript,
// the chips and the waveform all popped at once — the single most "broken
// demo" moment on the page. CALL_END lands the call and holds the result,
// FADE_AT dissolves the body, and only then does the loop restart.
const CALL_END = 14.8;      // last tool call resolves at 14.6 — this lands it
const FADE_AT = 16.2;       // body dissolves over the remaining 0.8s
const CALL_LOOP = 17.0;

const N_BARS = 40;
// Per-bar spectral weight — fuller in the middle (formant-ish), with a stable
// per-bar wobble so the line isn't a clean arch.
const SPEC = Array.from({ length: N_BARS }, (_, i) => {
  const x = i / (N_BARS - 1);
  return (0.45 + 0.55 * Math.sin(Math.PI * x)) * (0.78 + 0.22 * Math.sin(i * 12.9898));
});
// How much each bar participates in the idle "breathing" floor (below) — a
// taper that peaks at the centre and reaches zero before the row's ends, so
// silence reads as one deliberate pulse rather than 40 bars of low-grade
// noise. That uniform noise floor was the exact thing that made the waveform
// look broken rather than quiet whenever nobody was talking.
const CENTER_W = Array.from({ length: N_BARS }, (_, i) => {
  const d = Math.abs(i - (N_BARS - 1) / 2) / ((N_BARS - 1) / 2);
  return Math.max(0, 1 - d * 1.6);
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

export default function LiveTranscript() {
  // Transcript state is updated at most a few times/sec (word boundaries); the
  // waveform/colour/caption are written straight to the DOM every frame (refs).
  const [tx, setTx] = useState({ vis: 0, actIdx: -1, actWords: 0, acts: '000' });
  const rootRef = useRef(null);
  const barsRef = useRef([]);
  const waveRef = useRef(null);
  const capRef = useRef(null);
  const timeRef = useRef(null);
  const progRef = useRef(null);
  const bodyRef = useRef(null);
  const chipRef = useRef({});

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const bars = barsRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      setTx({ vis: CALL.length, actIdx: -1, actWords: 0, acts: '222' });
      bars.forEach((b, i) => { if (b) b.style.height = `${20 + SPEC[i] * 45}%`; });
      if (timeRef.current) timeRef.current.textContent = '00:14';
      if (progRef.current) progRef.current.style.width = '100%';
      if (capRef.current) capRef.current.textContent = 'Call complete';
      return undefined;
    }

    let raf = 0;
    let start = 0;
    let lastNow = 0;
    const cur = new Array(N_BARS).fill(0.06);
    let lastKey = '';

    const frame = (now) => {
      if (!start) start = now;
      // Bar smoothing used to be a fixed 0.5 per FRAME, which made the
      // waveform twice as twitchy on a 120Hz display as on a 60Hz one. It is
      // now a time constant, so the line looks the same on any refresh rate.
      const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60;
      lastNow = now;
      const smooth = 1 - Math.exp(-dt / 0.03);

      const t = ((now - start) / 1000) % CALL_LOOP;
      const ended = t >= CALL_END;
      const la = levelFor('agent', t);
      const lu = levelFor('user', t);
      const sum = la + lu;
      const both = la > 0.06 && lu > 0.06;

      // ONE mic, TWO voices: every bar carries both colours at once, split by
      // who is loud right now (agent share at the bottom, contact on top). Just
      // one --p drives all bars, so it stays cheap.
      const share = sum > 0.001 ? la / sum : 0.5;
      if (waveRef.current) waveRef.current.style.setProperty('--p', `${(share * 100).toFixed(1)}%`);

      // One shared waveform = the line audio (both voices summed). When
      // nobody's talking it settles to a slow centred breathing pulse — a
      // mic on standby, not a flat dead line — rather than every bar sitting
      // at the same low hum.
      const amp = Math.min(1.2, sum * (both ? 1.15 : 1));
      const quiet = 1 - Math.min(1, sum * 2);
      const breathe = 0.5 + 0.5 * Math.sin(t * 1.1);
      for (let i = 0; i < N_BARS; i++) {
        const flick = 0.4 + 0.6 * Math.abs(Math.sin(t * (6 + i * 0.55) + i));
        let target = amp * SPEC[i] * flick;
        if (both) target += 0.12 * Math.abs(Math.sin(t * (9 + i) + i * 3)); // messier when both talk
        if (Math.sin(t * (2.7 + i) + i * 2) > 0.9) target *= 0.25;          // dropouts
        const idleFloor = (0.015 + CENTER_W[i] * 0.11 * breathe) * quiet;
        target = Math.max(idleFloor, Math.min(1, target));
        cur[i] += (target - cur[i]) * smooth;
        const b = bars[i];
        if (b) b.style.height = `${6 + cur[i] * 90}%`;
      }

      // Speaker chips + caption (DOM, no re-render).
      if (chipRef.current.agent) chipRef.current.agent.style.opacity = la > 0.06 ? '1' : '0.32';
      if (chipRef.current.user) chipRef.current.user.style.opacity = lu > 0.06 ? '1' : '0.32';
      if (capRef.current) {
        capRef.current.textContent = ended ? 'Call complete'
          : both ? 'Both speaking' : la > 0.06 ? 'Agent speaking' : lu > 0.06 ? 'Marcos speaking' : 'Listening…';
      }
      if (progRef.current) {
        progRef.current.style.width = `${Math.min(100, (t / CALL_END) * 100).toFixed(1)}%`;
      }
      // Dissolve rather than cut. Without this the wrap is a hard pop on
      // every one of the five transcript lines at once.
      if (bodyRef.current) {
        bodyRef.current.style.opacity = t >= FADE_AT
          ? (1 - (t - FADE_AT) / (CALL_LOOP - FADE_AT)).toFixed(3)
          : '1';
      }
      // The call-duration readout used to be a hardcoded "00:14" that never
      // moved — dead chrome on a widget whose whole point is looking live.
      if (timeRef.current) {
        timeRef.current.textContent = `00:${String(Math.min(Math.floor(t), Math.floor(CALL_END))).padStart(2, '0')}`;
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
      else { cancelAnimationFrame(raf); raf = 0; start = 0; lastNow = 0; }
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
          <span ref={timeRef}>00:00</span>
        </span>
      </div>

      {/* Position in the call. The widget claimed to be live but gave no
          sense of where in the call you were, so a viewer landing mid-loop
          couldn't tell whether it had just started or was about to wrap. */}
      <div className="h-px bg-hairline" aria-hidden="true">
        <div ref={progRef} className="h-px bg-muted-soft" style={{ width: '0%' }} />
      </div>

      <div ref={bodyRef} style={{ opacity: 1 }}>

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
      <div className="lp-tx px-4 py-3 h-[150px] overflow-hidden flex flex-col justify-end gap-2">
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

      {/* Actions — the agent works across your tools, not just one. The three
          cards used to sit unrelated to each other; a fill track ties them
          into the one sequence they actually are, and the swap from spinner
          to check now animates in instead of popping. */}
      <div className="px-4 py-3 border-t border-hairline">
        <div className="flex items-center gap-1.5 mb-2 text-caption-uppercase uppercase text-body">
          <Zap size={11} /> Takes action across your tools
        </div>
        <div className="relative h-1 mb-2.5 rounded-full bg-hairline overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-success rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${(actStates.filter((s) => s >= 2).length / ACTIONS.length) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACTIONS.map((a, i) => {
            const st = actStates[i];
            const active = st >= 1;
            const isDone = st >= 2;
            return (
              <div key={a.id}
                className={`rounded-xl border px-2.5 py-2 transition-all duration-300 ${active ? 'border-hairline-strong bg-surface-card-elevated/60 -translate-y-0.5 shadow-lg shadow-black/30' : 'border-hairline opacity-55'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <a.Icon size={13} className={isDone ? 'text-success' : 'text-body-strong'} />
                  {isDone ? <Check key="done" size={11} className="ml-auto text-success lp-pop" />
                    : active ? <span key="spin" className="lp-spin ml-auto" /> : null}
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
    </div>
  );
}
