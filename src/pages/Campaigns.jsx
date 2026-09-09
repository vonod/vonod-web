import { ArrowRight, Database, GitBranch, Clock, Phone } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import SiteStyles from '../components/SiteStyles';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { PageCta } from '../components/PageShell';
import { useReveal } from '../lib/site';

/**
 * /campaigns/ — what happens across a run.
 *
 * Shape comes from the subject: a campaign is an operations problem, so the
 * page leads with the numbers, lays the stages out as a left-to-right
 * pipeline (the direction the run actually moves), and spends a whole section
 * on the clock, because "when is it acceptable to ring this person" is the
 * part nobody expects and the part that gets you blocked if you get it wrong.
 *
 * Node categories are the real ones from the campaign editor's registry
 * (workflow-editor/frontend/src/components/campaigns/nodes/registry.js).
 * Named nodes are real files in that tree. The editor also ships Salesforce
 * and HubSpot source nodes, but both providers are status:'soon' on the app's
 * integrations page, so they stay off a marketing page until they connect.
 */

const STATS = [
  { v: '312',     k: 'Concurrent calls', note: 'Dialing at the same instant, not queued.' },
  { v: '38.2%',   k: 'Connect rate',     note: 'Answered, and held past the opening line.' },
  { v: '$0.14',   k: 'Cost per call',    note: 'All-in, on your own provider keys.' },
  { v: '2h 14m',  k: 'Run time',         note: '5,000 contacts, launch to last number.' },
];

const STAGES = [
  { icon: Database, name: 'Sources', nodes: 'CSV Import · Google Sheets · API / Webhook · Database',
    body: 'Where the list comes from. Contacts land deduped and validated.' },
  { icon: GitBranch, name: 'Logic & Flow', nodes: 'Filter · Segment · Condition · A/B Split · Merge',
    body: 'Who gets called, in what order, and which agent answers for them.' },
  { icon: Clock, name: 'Scheduling', nodes: 'Business Hours · Time Window · Delay · Rate Limit',
    body: 'When it is acceptable to ring, in the contact’s own time zone.' },
  { icon: Phone, name: 'Actions', nodes: 'Outbound Call · SMS · WhatsApp · Email · Update CRM',
    body: 'What the run does. The call node is where an agent picks up.' },
];

// One instant, four time zones. Same UTC moment lands inside business hours
// for three of them and well before the working day for the fourth — which is
// the entire argument for the scheduling layer, and hard to make in prose.
const ZONES = [
  { tz: 'Europe/Madrid',      local: '16:00', at: 66.7, dialing: true },
  { tz: 'Europe/London',      local: '15:00', at: 62.5, dialing: true },
  { tz: 'America/New_York',   local: '10:00', at: 41.7, dialing: true },
  { tz: 'America/Los_Angeles', local: '07:00', at: 29.2, dialing: false },
];

export default function CampaignsPage() {
  useReveal();

  return (
    <div className="min-h-screen bg-canvas text-body-strong font-sans antialiased overflow-x-hidden">
      <SiteStyles />
      <SiteHeader current="/campaigns/" />

      {/* ── Hero: the claim, then the numbers, immediately ─────────────
          This page is about volume, so the figures are the hero's second
          line rather than a section two scrolls down. */}
      <section className="relative overflow-hidden">
        <div className="lp-glow" aria-hidden="true" />
        <div className="relative max-w-content mx-auto px-6 pt-xxl pb-xl md:pt-section">
          <p data-reveal className="reveal text-caption-uppercase uppercase text-muted mb-lg">Campaigns</p>
          <h1 data-reveal className="reveal text-display-lg sm:text-display-xl lg:text-[4.5rem] font-medium tracking-[-0.03em] leading-[1.05] max-w-[18ch] mb-lg"
              style={{ transitionDelay: '60ms' }}>
            One agent. Five thousand contacts.
          </h1>
          <p data-reveal className="reveal text-title-md text-body max-w-[42rem] text-pretty" style={{ transitionDelay: '120ms' }}>
            A campaign decides who gets called, when it is reasonable to call them, and what happens
            to each contact afterwards. The agent handles the conversation. The campaign handles
            everything around it.
          </p>
        </div>
      </section>

      <section className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline -mx-px">
            {STATS.map(({ v, k, note }, i) => (
              <div key={k} data-reveal className="reveal bg-canvas-deep px-5 py-7 md:px-7 md:py-9 flex flex-col"
                   style={{ transitionDelay: `${i * 60}ms` }}>
                <dd className="order-1 font-mono text-display-md lg:text-display-lg font-medium tabular-nums leading-none">{v}</dd>
                <dt className="order-2 mt-3 text-caption-uppercase uppercase text-body-strong">{k}</dt>
                <dd className="order-3 mt-1.5 text-body-sm text-body">{note}</dd>
              </div>
            ))}
          </dl>
          <p data-reveal className="reveal py-4 font-mono text-[0.6875rem] text-muted">
            One representative run. Your numbers depend on your list, your agent and your providers.
          </p>
        </div>
      </section>

      {/* ── The pipeline, left to right ───────────────────────────────
          Four stages laid out in the direction the run moves, not stacked as
          a list of features. */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[42rem] mb-14">
          <h2 className="text-display-sm sm:text-display-md font-medium mb-base">A run is a pipeline.</h2>
          <p className="text-body text-body-md">
            Four kinds of block, in the order a contact passes through them. Drop them on the
            canvas, or describe the run and let Vonod place them.
          </p>
        </div>

        <ol className="grid md:grid-cols-4 gap-px bg-hairline border border-hairline rounded-xl overflow-hidden">
          {STAGES.map((s, i) => (
            <li key={s.name} data-reveal className="reveal relative bg-canvas p-6 md:p-7 flex flex-col"
                style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-8 h-8 shrink-0 rounded-lg border border-hairline bg-surface-card-elevated flex items-center justify-center">
                  <s.icon size={15} className="text-body-strong" aria-hidden="true" />
                </span>
                <span className="font-mono text-[0.6875rem] text-muted tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="font-medium text-title-sm mb-2">{s.name}</h3>
              <p className="text-body-sm text-body mb-4">{s.body}</p>
              <p className="mt-auto font-mono text-[0.625rem] leading-relaxed text-muted">{s.nodes}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The clock ─────────────────────────────────────────────────
          The section this page exists to have. */}
      <section className="border-y border-hairline bg-canvas-deep">
        <div className="max-w-content mx-auto px-6 py-xxl md:py-section">
          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-16 items-center">
            <div data-reveal className="reveal">
              <p className="text-caption-uppercase uppercase text-body mb-lg">Scheduling</p>
              <h2 className="text-display-sm sm:text-display-md font-medium mb-base">
                9am where they are, not where you are.
              </h2>
              <p className="text-body text-body-md mb-lg">
                A list crosses time zones. The same instant is a reasonable hour in Madrid and a
                phone ringing before breakfast in California. Every contact is held until the
                working day has started for <em>them</em> — retries included, so the second attempt
                doesn’t undo the care taken on the first.
              </p>
              <p className="font-mono text-[0.6875rem] text-muted">
                Business Hours · Time Window · Holiday Check · Rate Limit
              </p>
            </div>

            <div data-reveal className="reveal" style={{ transitionDelay: '120ms' }}>
              <div className="flex items-baseline justify-between mb-5">
                <span className="text-caption-uppercase uppercase text-body">One instant, four zones</span>
                <span className="font-mono text-[0.6875rem] text-muted">14:00 UTC</span>
              </div>
              <div className="grid gap-4">
                {ZONES.map((z) => (
                  <div key={z.tz} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 items-center">
                    <span className="font-mono text-[0.6875rem] text-body truncate">{z.tz}</span>
                    <span className={`font-mono text-[0.6875rem] tabular-nums ${z.dialing ? 'text-body-strong' : 'text-muted'}`}>
                      {z.local} · {z.dialing ? 'dialing' : 'holding'}
                    </span>
                    <div className="col-span-2 relative h-1.5 rounded-full bg-surface-card overflow-hidden" aria-hidden="true">
                      {/* the working day, 09:00–18:00 */}
                      <span className="absolute inset-y-0 rounded-full bg-hairline-strong"
                            style={{ left: '37.5%', width: '37.5%' }} />
                      {/* where this contact's local clock sits at that instant */}
                      <span className={`absolute inset-y-0 w-0.5 ${z.dialing ? 'bg-ink' : 'bg-muted-soft'}`}
                            style={{ left: `${z.at}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-5 font-mono text-[0.625rem] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-1.5 rounded-full bg-hairline-strong" aria-hidden="true" /> 09:00–18:00 local
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 bg-ink" aria-hidden="true" /> now
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The canvas ───────────────────────────────────────────────── */}
      <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
        <div data-reveal className="reveal max-w-[42rem] mb-12">
          <h2 className="text-display-sm sm:text-display-md font-medium mb-base">Two layers, one canvas.</h2>
          <p className="text-body text-body-md">
            The run on the outside, the conversation on the inside. The agent’s own graph sits
            within the call node — and an inbound number skips the outer layer entirely.
          </p>
        </div>
        <div data-reveal className="reveal">
          <WorkflowCanvas />
        </div>
        <div data-reveal className="reveal mt-lg">
          <a href="/voice-agents/" className="group inline-flex items-center gap-1.5 text-body-sm font-medium text-body-strong underline decoration-hairline-strong underline-offset-4 hover:decoration-ink transition-colors">
            What happens inside that call node
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* ── After the call ───────────────────────────────────────────── */}
      <section className="border-t border-hairline">
        <div className="max-w-content mx-auto px-6 py-xxl md:py-section grid md:grid-cols-[1fr_1fr] gap-x-16 gap-y-8">
          <div data-reveal className="reveal">
            <h2 className="text-display-sm font-medium mb-base">A no-answer is not a dead contact.</h2>
          </div>
          <div data-reveal className="reveal grid gap-6" style={{ transitionDelay: '80ms' }}>
            <p className="text-body text-body-md">
              Every call ends with an outcome, and the outcome is what the run branches on. Booked
              contacts leave. No-answers go back in the queue at a different hour — through the
              scheduling layer again, so attempt two lands inside business hours too. Wrong numbers
              are tagged so nobody rings them twice.
            </p>
            <p className="text-body text-body-md">
              Connect rate, outcome mix and cost per conversation stream while the run is going, not
              in a report afterwards. Pause mid-run without losing progress.
            </p>
          </div>
        </div>
      </section>

      <PageCta
        title="Your first 5,000 calls are one click away."
        body="Import a list, pick the agent, and launch. No sales call, no demo, no commitment."
        label="Launch a campaign free"
      />

      <SiteFooter />
    </div>
  );
}
