import { useEffect, useRef } from 'react';

/**
 * The two canvases, as the platform actually has them.
 *
 * The page's problem before this component existed: the only product artifact
 * on it was the live call widget, which shows an agent *running*. A visitor
 * came away knowing Vonod places calls, and with no idea that the thing you
 * build is a graph — or that there are two of them. Everything the platform
 * is actually for (design a conversation, orchestrate a run, point a number
 * at an agent) was prose in a features grid.
 *
 * So: the campaign graph on top, the agent graph nested underneath it inside
 * the Outbound Call node, and an inbound number arriving straight at the
 * agent — bypassing the campaign layer entirely, which is what the backend
 * really does (`PhoneNumber.inbound_workflow` is a direct FK to a workflow;
 * inbound never runs through a campaign).
 *
 * Node labels are the real ones from the editors — Sources / Logic & Flow /
 * Scheduling / Actions on the campaign side, Start / Conversation / Scenario
 * / Action / End on the agent side. Someone who signs up should recognise
 * this canvas, so nothing here is invented vocabulary.
 *
 * Motion discipline: this is a demo, not decoration. It builds once, then
 * loops only the run — replaying the build every 18s would read as a page
 * that fidgets. Nothing floats, nothing breathes, nothing pulses at rest.
 * Gated on an IntersectionObserver, and prefers-reduced-motion gets the
 * finished graph with no token and no animation.
 */

const W = 880;
const H = 340;

// You don't draw this graph node by node — you describe it. The prompt types
// first, the graph builds in answer to it, and only then does the run play.
// That ordering is the whole point of the section: the canvas is an OUTPUT.
const PROMPT = 'Call every lead in the CSV during their business hours, book demos, retry no-answers.';
const D = 2.4;           // the prompt owns the first 2.4s; everything else shifts
const LOOP = 18.0 + D;
const RUN_START = 5.0 + D;

// Campaign graph — what happens ACROSS a run.
const CAMPAIGN = [
  { id: 'c1', label: 'CSV Import',     cat: 'Sources',       x: 6,   y: 20, w: 118, h: 44, appear: 0.3, dwell: [[5.0, 5.4]] },
  { id: 'c2', label: 'Deduplicate',    cat: 'Logic & Flow',  x: 142, y: 20, w: 118, h: 44, appear: 0.7, dwell: [[6.0, 6.4]] },
  { id: 'c3', label: 'Business Hours', cat: 'Scheduling',    x: 278, y: 20, w: 130, h: 44, appear: 1.1, dwell: [[7.0, 7.4]] },
  { id: 'c4', label: 'Outbound Call',  cat: 'Actions',       x: 426, y: 20, w: 130, h: 44, appear: 1.5, dwell: [[8.0, 8.6]], lead: true },
  { id: 'c5', label: 'Condition',      cat: 'Logic & Flow',  x: 574, y: 20, w: 108, h: 44, appear: 1.9, dwell: [[15.4, 15.8]] },
  { id: 'c6', label: 'Retry',          cat: 'Scheduling',    x: 700, y: 2,  w: 104, h: 32, appear: 2.3, dwell: [] },
  { id: 'c7', label: 'Update CRM',     cat: 'Actions',       x: 700, y: 50, w: 104, h: 32, appear: 2.3, dwell: [[16.2, 16.6]] },
];

// Agent graph — what happens INSIDE one call.
const AGENT = [
  { id: 'a1', label: 'Start',        x: 176, y: 170, w: 76,  h: 40, appear: 3.0, dwell: [[9.4, 9.8], [17.4, 18.0]] },
  { id: 'a2', label: 'Conversation', x: 272, y: 170, w: 136, h: 40, appear: 3.3, dwell: [[10.4, 11.2]] },
  { id: 'a3', label: 'Scenario',     x: 428, y: 170, w: 104, h: 40, appear: 3.6, dwell: [[11.8, 12.4]] },
  { id: 'a4', label: 'Action',       x: 406, y: 252, w: 104, h: 36, appear: 3.9, dwell: [[13.0, 13.8]] },
  { id: 'a5', label: 'End',          x: 530, y: 252, w: 76,  h: 36, appear: 4.2, dwell: [[14.2, 14.6]] },
];

const shiftNode = (n) => ({ ...n, appear: n.appear + D, dwell: n.dwell.map(([a, b]) => [a + D, b + D]) });
const NODES = [...CAMPAIGN, ...AGENT].map(shiftNode);

// `soft` edges are the two structural relationships rather than data flow:
// the nesting drop into the agent graph, the outcome returning to the
// campaign, and the inbound number arriving from outside.
const EDGES_RAW = [
  { id: 'e1', d: 'M124,42 H136',                    appear: 0.5 },
  { id: 'e2', d: 'M260,42 H272',                    appear: 0.9 },
  { id: 'e3', d: 'M408,42 H420',                    appear: 1.3 },
  { id: 'e4', d: 'M556,42 H568',                    appear: 1.7 },
  { id: 'e5', d: 'M682,42 H691 V18 H694',           appear: 2.1 },
  { id: 'e6', d: 'M682,42 H691 V66 H694',           appear: 2.1 },
  { id: 'e7', d: 'M491,64 V104 H214 V164',          appear: 2.6, soft: true },
  { id: 'f1', d: 'M252,190 H266',                   appear: 3.2 },
  { id: 'f2', d: 'M408,190 H422',                   appear: 3.5 },
  { id: 'f3', d: 'M480,210 V232 H458 V246',         appear: 3.8 },
  { id: 'f4', d: 'M480,210 V232 H568 V246',         appear: 3.8 },
  { id: 'f5', d: 'M510,270 H524',                   appear: 4.1 },
  { id: 'e8', d: 'M606,270 H746 V96 H634 V70',      appear: 4.5, soft: true },
  { id: 'e9', d: 'M14,190 H170',                    appear: 4.8, soft: true },
];
const EDGES = EDGES_RAW.map((e) => ({ ...e, appear: e.appear + D }));

// Where the token is between dwells. Each entry is one edge traversal.
const ROUTE_RAW = [
  ['e1', 5.4, 6.0], ['e2', 6.4, 7.0], ['e3', 7.4, 8.0],
  ['e7', 8.6, 9.4],
  ['f1', 9.8, 10.4], ['f2', 11.2, 11.8], ['f3', 12.4, 13.0], ['f5', 13.8, 14.2],
  ['e8', 14.6, 15.4], ['e6', 15.8, 16.2],
];
const ROUTE = ROUTE_RAW.map(([id, a, b]) => [id, a + D, b + D]);

// Narration. Read top to bottom; the last entry whose time has passed wins.
const CAPTIONS_RAW = [
  [0.0,  'Draft'],
  [5.0,  'Loading and segmenting 5,000 contacts'],
  [7.0,  'Holding until 9am in each time zone'],
  [8.0,  'Dialing Marcos Ruiz'],
  [8.6,  'Handing the call to the agent'],
  [9.8,  'Running the conversation'],
  [11.8, 'Branching on what he said'],
  [13.0, 'Booking · logging · confirming'],
  [14.2, 'Outcome: meeting booked'],
  [14.6, 'Outcome returned to the campaign'],
  [15.8, 'Writing it back to the CRM'],
  [16.6, 'Inbound call — straight to the agent, no campaign'],
];
// The first caption covers the prompt; the rest ride the same shift.
const CAPTIONS = CAPTIONS_RAW.map(([t, text], i) => [i === 0 ? 0 : t + D, text]);

const inWindow = (windows, t) => windows.some(([a, b]) => t >= a && t < b);

function Node({ node, nodeRef }) {
  const { label, cat, x, y, w, h, lead } = node;
  return (
    <div
      ref={nodeRef}
      className={`absolute rounded-md border flex flex-col justify-center px-2.5 transition-colors duration-200 ${
        lead ? 'border-hairline-strong bg-surface-strong' : 'border-hairline bg-surface-card-elevated'
      }`}
      style={{ left: x, top: y, width: w, height: h, opacity: 0 }}
    >
      <span className="text-[0.6875rem] font-medium leading-tight text-body-strong truncate">{label}</span>
      {cat && <span className="font-mono text-[0.5625rem] leading-tight text-muted truncate">{cat}</span>}
    </div>
  );
}

export default function WorkflowCanvas() {
  const rootRef = useRef(null);
  const nodeRefs = useRef({});
  const edgeRefs = useRef({});
  const tokenRef = useRef(null);
  const capRef = useRef(null);
  const promptRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Finished state: every node up, every edge drawn, no token.
    const settle = () => {
      NODES.forEach((n) => {
        const el = nodeRefs.current[n.id];
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      EDGES.forEach((e) => {
        const el = edgeRefs.current[e.id];
        if (el) el.style.strokeDashoffset = '0';
      });
      if (tokenRef.current) tokenRef.current.style.opacity = '0';
    };

    // Edge draw-on needs each path's real length, elbows included.
    const lengths = {};
    EDGES.forEach((e) => {
      const el = edgeRefs.current[e.id];
      if (!el) return;
      const len = el.getTotalLength();
      lengths[e.id] = len;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
    });

    if (reduce) {
      settle();
      if (capRef.current) capRef.current.textContent = 'Outcome: meeting booked';
      if (promptRef.current) promptRef.current.textContent = PROMPT;
      return undefined;
    }

    let raf = 0;
    let start = 0;
    let lastCap = '';

    const frame = (now) => {
      if (!start) start = now;
      let t = (now - start) / 1000;
      // The build plays once. Every subsequent pass restarts at the run, so
      // the graph never redraws itself in front of someone already reading it.
      if (t >= LOOP) { start = now - RUN_START * 1000; t = RUN_START; }

      // The prompt types itself out, then the graph answers it. Once the
      // build has played the prompt just stays put — it is context for the
      // run, not something to retype at people every loop.
      if (promptRef.current) {
        const p = Math.max(0, Math.min(1, (t - 0.25) / (D - 0.55)));
        const shown = PROMPT.slice(0, Math.round(PROMPT.length * p));
        if (promptRef.current.textContent !== shown) promptRef.current.textContent = shown;
      }

      for (const n of NODES) {
        const el = nodeRefs.current[n.id];
        if (!el) continue;
        const shown = t >= n.appear;
        const p = shown ? Math.min(1, (t - n.appear) / 0.25) : 0;
        el.style.opacity = shown ? String(0.55 + 0.45 * p) : '0';
        el.style.transform = shown ? `translateY(${((1 - p) * 6).toFixed(2)}px)` : 'translateY(6px)';
        const hot = inWindow(n.dwell, t);
        el.style.borderColor = hot ? 'var(--color-ink)' : '';
        el.style.background = hot ? 'var(--color-surface-strong)' : '';
      }

      for (const e of EDGES) {
        const el = edgeRefs.current[e.id];
        if (!el) continue;
        const len = lengths[e.id] || 0;
        const p = Math.max(0, Math.min(1, (t - e.appear) / 0.35));
        el.style.strokeDashoffset = `${len * (1 - p)}`;
      }

      // Token: parked at a node while it works, on an edge while in transit.
      const tok = tokenRef.current;
      if (tok) {
        const hotNode = NODES.find((n) => inWindow(n.dwell, t));
        const leg = ROUTE.find(([, a, b]) => t >= a && t < b);
        if (hotNode) {
          tok.style.opacity = '1';
          tok.setAttribute('cx', String(hotNode.x + hotNode.w / 2));
          tok.setAttribute('cy', String(hotNode.y + hotNode.h / 2));
        } else if (leg) {
          const [id, a, b] = leg;
          const el = edgeRefs.current[id];
          const len = lengths[id] || 0;
          if (el && len) {
            const pt = el.getPointAtLength(len * ((t - a) / (b - a)));
            tok.style.opacity = '1';
            tok.setAttribute('cx', String(pt.x));
            tok.setAttribute('cy', String(pt.y));
          }
        } else {
          tok.style.opacity = '0';
        }
      }

      let cap = CAPTIONS[0][1];
      for (const [at, text] of CAPTIONS) if (t >= at) cap = text;
      if (cap !== lastCap && capRef.current) { lastCap = cap; capRef.current.textContent = cap; }

      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(raf); raf = 0; start = 0; }
    }, { threshold: 0.25 });
    io.observe(root);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={rootRef} className="rounded-xl border border-hairline bg-surface-card overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-hairline">
        <span className="w-2 h-2 rounded-full bg-success" />
        <span className="text-caption font-medium text-body">Northwind Q1 · outbound + inbound</span>
        <span ref={capRef} className="ml-auto font-mono text-[0.6875rem] text-body truncate">Draft</span>
      </div>

      {/* The instruction that produced everything below it. */}
      <div className="flex items-start gap-2 px-4 py-2.5 border-b border-hairline bg-canvas-deep/40">
        <span className="mt-px shrink-0 font-mono text-body-sm text-muted select-none" aria-hidden="true">&rsaquo;</span>
        <p className="text-body-sm text-body-strong leading-snug">
          <span ref={promptRef} />
          <span className="wf-caret" aria-hidden="true" />
        </p>
      </div>

      <div className="overflow-x-auto">
        <div
          className="relative mx-auto"
          style={{ width: W, height: H }}
          role="img"
          aria-label="Two graphs. A campaign graph runs Salesforce, Deduplicate, Business Hours, Outbound Call and Condition, branching to Retry and Update CRM. The Outbound Call node contains an agent graph — Start, Conversation, Scenario, Action, End — which runs the call itself and returns its outcome to the campaign. An inbound phone number arrives directly at the agent graph, bypassing the campaign entirely."
        >
          <svg
            className="absolute inset-0 pointer-events-none"
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            aria-hidden="true"
          >
            <defs>
              <marker id="wf-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <polygon points="0,1 8,5 0,9" fill="var(--color-muted)" />
              </marker>
            </defs>

            {/* The agent graph's frame — dashed, because it is a containment
                boundary rather than a connection. */}
            <rect
              x="150" y="132" width="580" height="190" rx="12"
              fill="var(--color-canvas-deep)" fillOpacity="0.5"
              stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="4 4"
            />

            {EDGES.map((e) => (
              <path
                key={e.id}
                ref={(el) => { edgeRefs.current[e.id] = el; }}
                d={e.d}
                fill="none"
                stroke={e.soft ? 'var(--color-muted-soft)' : 'var(--color-hairline-strong)'}
                strokeWidth="1.5"
                strokeDasharray={e.soft ? '4 3' : undefined}
                markerEnd="url(#wf-tip)"
              />
            ))}

            <circle ref={tokenRef} r="4" fill="var(--color-ink)" cx="-10" cy="-10" style={{ opacity: 0 }} />

            <text x="150" y="124" fill="var(--color-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="0.06em">
              AGENT — runs inside every call
            </text>
            <text x="6" y="10" fill="var(--color-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="0.06em">
              CAMPAIGN — runs across the whole list
            </text>
            <text x="14" y="178" fill="var(--color-muted)" fontSize="10" fontFamily="JetBrains Mono, monospace">
              inbound number
            </text>
            <text x="14" y="212" fill="var(--color-muted-soft)" fontSize="9" fontFamily="JetBrains Mono, monospace">
              no campaign needed
            </text>
          </svg>

          {NODES.map((n) => (
            <Node key={n.id} node={n} nodeRef={(el) => { nodeRefs.current[n.id] = el; }} />
          ))}
        </div>
      </div>

      {/* The graph is 880px and stays that size — scaled to a phone the node
          labels would land around 4px. So it scrolls, and below ~880px that
          needs saying, because a diagram gives no scroll affordance of its
          own and a visitor would otherwise read a cropped graph as the
          whole graph. */}
      <div className="xl:hidden px-4 py-2 border-t border-hairline font-mono text-[0.625rem] text-muted">
        Scroll the graph sideways to see the whole run →
      </div>
    </div>
  );
}
