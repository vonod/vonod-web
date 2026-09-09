import { ArrowRight, PhoneIncoming } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import SiteStyles from '../components/SiteStyles';
import LiveTranscript from '../components/LiveTranscript';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { PageCta } from '../components/PageShell';
import { useReveal } from '../lib/site';

/**
 * /voice-agents/ — what happens inside one call.
 *
 * The page's shape comes from its subject: a call is a thing that happens in
 * TIME, so the spine of this page is a clock. The hero puts the call itself
 * beside the claim instead of under it, and the five node types are a
 * timeline with real timecodes rather than a grid of cards — the same
 * timecodes the demo widget above actually plays.
 *
 * Node vocabulary is the real one from the agent editor
 * (workflow-editor/frontend/src/components/agents/nodes): Start,
 * Conversation, Scenario, Action, End. Don't invent names — someone who signs
 * up should recognise the canvas.
 */

// Times line up with the CALL timeline in LiveTranscript, so the timeline
// below is a legend for the widget above rather than a second invented story.
const BEATS = [
  { t: '00:00', name: 'Start',
    body: 'The call opens with everything it knows about this contact already loaded — name, company, time zone, and what this call is for.',
    detail: 'tz="Europe/Madrid" · goal="Book a demo"' },
  { t: '00:03', name: 'Conversation',
    body: 'A stretch of talking with a goal, not a script. The agent improvises inside it, and can be cut off mid-word without losing the thread.',
    detail: '“Vonod assistant here, from Northwind.”' },
  { t: '00:06', name: 'Scenario',
    body: 'The branch. It routes on what the person actually said — a correction, a brush-off, a wrong number — not on a keypress or a keyword match.',
    detail: '“Actually, Friday works better.” → reschedule' },
  { t: '00:11', name: 'Action',
    body: 'Reaches your tools while the line is still open. The person hears a pause, not a callback promise.',
    detail: 'book_appointment · log_outcome · send_confirmation' },
  { t: '00:14', name: 'End',
    body: 'Hangs up with an outcome attached. That outcome is the thing the campaign branches on afterwards.',
    detail: 'outcome = meeting_booked' },
];

export default function VoiceAgentsPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-canvas text-body-strong font-sans antialiased overflow-x-hidden">
      <SiteStyles />
      <SiteHeader current="/voice-agents/" />

      {/* ── Hero: the claim and the call, side by side ────────────────
          Every other page opens on a wall of type. This one opens on the
          product doing the thing, because the thing is watchable. */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div className="lp-glow" aria-hidden="true" />
        <div className="relative max-w-content mx-auto px-6 py-xxl md:py-section grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
          <div>
            <p data-reveal className="reveal text-caption-uppercase uppercase text-muted mb-lg">Voice agents</p>
            <h1 data-reveal className="reveal text-display-lg sm:text-display-xl font-medium tracking-[-0.03em] leading-[1.05] mb-lg"
                style={{ transitionDelay: '60ms' }}>
              A call is a graph,<br />not a script.
            </h1>
            <p data-reveal className="reveal text-title-md text-body text-pretty mb-xl" style={{ transitionDelay: '120ms' }}>
              It opens, listens, branches on what the person actually says, touches your tools
              mid-sentence, and hangs up with an outcome. Watch one get interrupted and keep up.
            </p>
            <div data-reveal className="reveal flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.6875rem] text-muted"
                 style={{ transitionDelay: '180ms' }}>
              <span>0.7s average reply</span>
              <span>interruptible mid-word</span>
              <span>tools mid-call</span>
            </div>
          </div>
          <div data-reveal className="reveal" style={{ transitionDelay: '160ms' }}>
            <LiveTranscript />
          </div>
        </div>
      </section>

      {/* ── The five nodes, as a clock ────────────────────────────────
          A vertical timeline rather than five cards: the node types are the
          order a call happens in, and the timecodes are the ones the widget
          above actually plays. */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[42rem] mb-14">
          <h2 className="text-display-sm sm:text-display-md font-medium mb-base">Five kinds of node. That is the whole vocabulary.</h2>
          <p className="text-body text-body-md">
            Everything an agent can do is one of these, wired to the next. Here they are in the
            order the call above ran them.
          </p>
        </div>

        <ol className="max-w-[52rem]">
          {BEATS.map((b, i) => (
            <li key={b.name} data-reveal className="reveal relative grid grid-cols-[3.5rem_1.5rem_1fr] sm:grid-cols-[4.75rem_1.5rem_1fr] gap-x-4 sm:gap-x-6 pb-10 last:pb-0"
                style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="font-mono text-[0.75rem] text-muted tabular-nums pt-0.5 text-right">{b.t}</span>
              {/* The connector is drawn per item and centred on its own dot,
                  so it stays aligned if the grid columns ever change. A single
                  absolutely-positioned spine on the <ol> was 24px off the
                  dots the moment the column widths moved. */}
              <span className="relative flex justify-center pt-1.5" aria-hidden="true">
                <span className="relative z-10 w-2.5 h-2.5 rounded-full bg-canvas border-2 border-muted-soft" />
                {i < BEATS.length - 1 && (
                  <span className="absolute top-4 bottom-[-2.5rem] left-1/2 -translate-x-1/2 w-px bg-hairline" />
                )}
              </span>
              <div className="min-w-0">
                <h3 className="font-medium text-title-sm mb-1.5">{b.name}</h3>
                <p className="text-body-sm text-body mb-2.5 max-w-[38rem]">{b.body}</p>
                <p className="font-mono text-[0.6875rem] text-muted break-words">{b.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── How it gets built ────────────────────────────────────────── */}
      <section className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-xxl md:py-section">
          <div data-reveal className="reveal max-w-[42rem] mb-12">
            <h2 className="text-display-sm sm:text-display-md font-medium mb-base">You describe it. Vonod draws it.</h2>
            <p className="text-body text-body-md">
              Nothing on this canvas was dragged into place. Say what the call should do and the
              nodes, branches, tool calls and variables come back laid out. Change your mind and
              say so — it rewires.
            </p>
          </div>
          <div data-reveal className="reveal">
            <WorkflowCanvas />
          </div>
          <div data-reveal className="reveal mt-lg">
            <a href="/mcp/" className="group inline-flex items-center gap-1.5 text-body-sm font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
              Do the same from Claude or your own CLI
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Inbound, as an aside ─────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[52rem] border-l-2 border-hairline-strong pl-6 sm:pl-8">
          <PhoneIncoming size={18} className="text-body mb-4" aria-hidden="true" />
          <h2 className="text-display-sm font-medium mb-base">An agent does not need a campaign.</h2>
          <p className="text-body text-body-md mb-lg max-w-[38rem]">
            Point a phone number at an agent and it answers. No list, no schedule, no run — the call
            arrives and the same graph handles it. The campaign layer only exists for the calls
            <em> you </em> start.
          </p>
          <p className="font-mono text-[0.75rem] text-muted mb-lg">
            +34 910 000 000 &nbsp;→&nbsp; Support triage
          </p>
          <a href="/campaigns/" className="group inline-flex items-center gap-1.5 text-body-sm font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
            How outbound runs work
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      <PageCta
        title="Describe your first agent."
        body="Bring your own provider keys, say what the call should do, and try it on your own phone before it ever dials a list."
      />

      <SiteFooter />
    </div>
  );
}
