# Messaging & SEO — Vonod

Single source of truth for the mission, the positioning statement, and how both
become on-page copy and search metadata. If the site and this document
disagree, this document wins — fix the copy, don't fork the message.

`BUSINESS.md` (who pays for what) lives in the platform repo, not here; this
repo is the marketing site only. Paths below are relative to this repo's root:
[`index.html`](index.html), [`src/LandingPage.jsx`](src/LandingPage.jsx).

**Status.** §1–§5 are settled enough to write copy against. §6 has a
recommendation that is already shipped in `index.html`. §7 lists what still
needs a human decision — three of the four are commercial, not editorial.

---

## 1. The core reframe

The site reads as **"an AI phone-calling company."** Not wrong, but narrower
than the business, and it is why the message feels thin: "AI phone campaigns at
scale" is a feature category, not a reason to exist.

**Vonod is an agent orchestration platform.** Voice campaigns are the flagship
workload today, not the ceiling. The company runs the infrastructure that
deploys, schedules and orchestrates AI agents at scale; calling is the first
thing proven on top of it.

That reframe is also where the differentiation lives:

> **You pay Vonod for the system. You never pay Vonod for the AI.**

Vonod Cloud bills for orchestration — room provisioning, agent dispatch,
campaign scheduling, concurrency, an always-on worker fleet. LLM tokens, STT,
TTS and telephony minutes are BYOK, billed by the provider directly to the
customer at zero markup. Bland, Vapi, Retell and Synthflow mark up or bundle AI
usage. That is the wedge, and it is structural — a competitor cannot copy it by
rewriting a homepage, only by changing what they sell.

**Mission (working draft):**

> Vonod orchestrates AI agents at scale — so you pay for the infrastructure
> that runs your campaigns, never a markup on the AI that powers them.

**Positioning, one line:**

> The orchestration layer for AI agent campaigns — bring your own AI, we run it
> at scale.

### The objection this creates

BYOK is a differentiator **and** an onboarding tax, and the messaging has to
carry both or it will lose deals it thinks it is winning. A RevOps buyer who
must open OpenAI, Deepgram, ElevenLabs and Twilio accounts before placing a
single call has a worse first hour than a competitor who sends one invoice.
"Zero markup" wins the second conversation; it can lose the first.

So the page should answer it rather than hope nobody asks:

- Say what BYOK costs in effort, in plain numbers ("four keys, about ten
  minutes"), somewhere near the CTA — not in a FAQ nobody scrolls to.
- Say what it buys beyond price: no vendor lock on models, provider pricing
  drops reach you the same day, and the usage bill is auditable because it
  comes from the provider.
- If a guided/managed-keys path ever exists, that is the single highest-value
  thing this page could add. Until then, do not pretend the friction isn't
  there.

---

## 2. Who it's for

"Everyone" is technically true and unmarketable. Lead with the buyer who has
the sharpest version of the problem and let the proof points pull in the rest.

1. **Sales/RevOps teams** running their own outbound (SDR replacement,
   demo-booking, lead qualification). They feel "one call at a time" directly
   and can put a number on cost-per-conversation.
2. **Agencies and BPOs** running outbound for multiple clients. They feel the
   AI-markup pain hardest — margin stacked on margin — and care most about
   multi-tenant scale.
3. **Developers and builders** who want an orchestration layer they can extend
   or self-host rather than a locked SaaS. Smaller volume, but they read the
   AGPL story and become advocates.

Hero and meta speak to #1. Supporting sections speak to #2 — the campaign and
multi-agent features already do. Footer and docs speak to #3. Do not try to say
all three in the H1; that is how you get "everyone" and say nothing.

---

## 3. Differentiation, ranked

| # | Differentiator | Status | Where it belongs |
|---|---|---|---|
| 1 | **No AI markup — pay for orchestration, not tokens** | Confirmed, structural | Hero, or immediately below it. Currently buried in the trust strip ("Runs on your stack") and the tail of the meta description. |
| 2 | **Campaign scale & concurrency** | Confirmed, already the message | Already strong. Keep it, but make it support #1 rather than stand alone. |
| 3 | **Open source / self-hostable (AGPL-3.0)** | Secondary | Answers "can I trust and audit this," not "why do I need this." Near the CTA or footer, not the hero. Currently absent from the page entirely. |

#1 outranks #2 because "scale" is a claim every competitor also makes — Bland,
Vapi and Retell all say "thousands of concurrent calls." "You don't pay us for
the AI" is one almost none of them can make.

**Durability.** A zero-markup claim invites "so how do you make money, and will
that hold?" The page should answer the first half in one clause (orchestration
is the product) and the second half by committing, not hedging. A hedged
version of this claim is worth less than not making it — buyers read hedging as
a price rise being scheduled. Messaging should match policy 1:1.

---

## 4. Voice and tone

**Outcome/ROI-driven, sales-ops register.**

- Lead with what changes in the buyer's numbers — meetings booked, cost per
  conversation, hours of dialing removed — not with latency or concurrency.
- Keep the technical proof (sub-second turn-taking, concurrency ceiling, the
  provider list). It is credibility, not filler. Place it as the second beat.
- Numbers stay concrete. **But see the warning below before reusing the ones
  currently on the page.**

### The numbers on the page are illustrative, not measured

`src/LandingPage.jsx` shows `$0.14` cost per call, `38.2%` connect rate, `0.7s`
reply, `312` concurrent, `2,417 of 5,000`. Those are invented, and the page
labels them so ("A typical 5,000-contact run", "Simulated call · one of
thousands in a run"). That labelling is doing real work and must not be dropped
in a copy pass.

Treating them as a strength of the copy is a mistake until they are replaced
with figures from a real run. Specific fake numbers are worse than round honest
ones: they are the first thing a technical buyer will ask you to source, and
"we made them up for the website" is a bad answer in a sales call.

### Hero direction

The doc that preceded this one proposed *"Run outreach at scale. Pay for the
system, not the AI."* It is two imperatives bolted together and "the system" is
vague — it should not ship as-is.

Three candidates that carry both halves of the pitch:

| | H1 | Carries | Cost |
|---|---|---|---|
| A | Call everyone. Personally. | Scale + the individual conversation | Says nothing about billing. |
| **B** | Dial thousands. Zero AI markup. *(shipped, see below)* | Scale + the wedge, in one breath | Needed the subhead immediately, to say the AI still costs money — it's the markup that's zero, not the AI |
| C | Your campaigns. Your API keys. Our infrastructure. | The wedge, explicitly | Loses the scale claim; more rational than emotional |

**Shipped, `src/LandingPage.jsx`:** candidate B, trimmed from the literal
"Thousands of calls. None of them billed by us." — at the hero's display size
that line wraps to a second line and pushes the section past one screen
(verified in-browser; `min-h-[calc(100svh-4rem)]` then clips). "Dial
thousands." keeps the verb the site used before this pass and matches "Call
everyone."'s length, so it holds the one-line-per-half layout the outlined
second line depends on.

Eyebrow shipped as `AI calling campaigns` — this matches the primary search
phrase (§6) rather than repeating "zero markup" a second time right above a
headline that already says it.

Subhead shipped: *"Vonod dials thousands of numbers at once. Bring your own
OpenAI, Deepgram, ElevenLabs, and Twilio keys — we never mark up a token, a
minute, or a call."* — the disambiguating clause moved earlier than the
original draft, since "Zero AI markup" alone in the H1 has one extra beat
before a reader learns markup ≠ cost.

> **Conflict resolved.** PR #1 (`redesign/hero`) shipped candidate A without
> the billing wedge — exactly the state this document existed to flag. This
> pass re-cut the H1 to B directly on top of PR #1's layout fixes (the globe
> horizon, the mobile visibility fix), rather than merging A and patching the
> wedge in underneath it. If PR #1 merges to `main` before this branch does,
> rebase; don't let A go live and leave this branch stale.

---

## 5. On-page structure

Priority order for a first-time visitor:

1. **Hero** — what it does (AI calling campaigns at scale) and the billing wedge
   (pay for infrastructure, not AI) in one breath. **Shipped**: §4.
2. **Trust strip** — proof the BYOK claim is real. Frame the provider logos as
   *"your keys, your bill"*, not as a logo wall. **Shipped** — the strip read
   "Runs on your stack" (an integration list) and now reads "Your keys, your
   bill —" ahead of the same provider names.
3. **Features** — scale, concurrency, campaign tooling. Already good. This is
   proof, not the pitch. Untouched.
4. **Live demo** — strong as-is. Keep the "simulated" label. Untouched.
5. **How it works** — the BYOK-effort answer from §1's objection now lives
   here: step 02 is retitled "Bring your keys, design your campaign" and its
   body names the four providers explicitly, rather than leaving key-setup
   implied inside "configure the campaign."
6. **OSS / self-host** — was absent. **Shipped** as a footer line: "Self-
   hostable, AGPL-3.0 — audit the code or run it yourself." A dedicated
   section is still on the table if OSS gets promoted past "secondary" (§3,
   §7) — a footer line is the right weight for where it stands today.

---

## 6. SEO

### Positioning phrase ≠ search phrase

The previous draft asked us to pick one phrase and repeat it verbatim across
title, description, H1 and the first 100 words. That is outdated advice and it
actively fights §4. Exact-match repetition has not been a ranking factor for
years, it reads as spam to a human, and the phrase it would force —
"AI agent orchestration platform" — is a category we are trying to *create*.
Almost nobody types it into a search bar.

Split the job instead:

- **Title and meta description carry the search phrase.** People search for the
  workload: *AI calling*, *outbound AI*, *AI cold calling software*, *AI SDR*,
  *AI phone agents*. "Calling" is the flagship workload today, so lead with it.
- **H1 and body carry the positioning.** Orchestration, zero markup, BYOK. This
  is what a visitor who already landed needs to understand, and it is where the
  broader story belongs.

They converge as the category matures. Forcing them together now costs
conversion on the page and buys no ranking.

**Primary search phrase: "AI calling campaigns."** Narrow enough to rank for,
broad enough to survive the product growing past calls, and it is what segment
#1 in §2 actually types.

### Shipped in `index.html`

```html
<title>Vonod — AI calling campaigns at scale, zero AI markup</title>
<meta name="description" content="Outbound AI calling campaigns at scale. You pay for the orchestration — never a markup on the AI. Bring your own OpenAI, Deepgram and Twilio keys." />
```

52 and 145 characters — both inside the ~60 and ~155 cut-offs. The billing
wedge is the second clause, not the last, so it survives truncation. The
old title ("Voice AI agents that actually call") sold the narrow framing §1
rejects; the old description put BYOK fourth, where snippets cut it.

The OG and Twitter tags now repeat the same two strings verbatim. Previously
`og:description` was a *third* distinct pitch ("Build voice agents that make
real phone calls. Visual workflows, live transcripts, BYOK.").

Also added: `rel=canonical` and `og:url` (the site answers on both the bare and
trailing-slash Pages URL), `og:site_name`, `og:locale`, `twitter:card`.

### Still open, technical

- **No social card image.** `twitter:card` is `summary`, not
  `summary_large_image`, and there is no `og:image`. The only images in the repo
  are transparent logos, which most clients composite onto white — the white
  wordmark would disappear. This needs a designed 1200×630 asset; it is the
  single highest-impact remaining SEO item, because every shared link currently
  renders as a text-only card.
- **No structured data.** A `SoftwareApplication` or `Organization` JSON-LD
  block is cheap and helps entity resolution. Do not add `AggregateRating` or
  `Offer` until there are real reviews and public pricing.
- **One H1 per page.** Currently true. Keep it true if sections get added.
- **Alt text.** The logo images use `alt="Vonod"` and `alt=""`, correctly. The
  globe canvas is `aria-hidden`, correctly. No action.
- **`404.html`** is a copy of `index.html` (see `pages.yml`), so a mistyped deep
  link returns the landing page with a 404 status. Fine for a one-page site;
  revisit if real routes appear.

---

## 7. Open items

Editorial — I have made a provisional call, override if you disagree:

- [x] Primary search phrase: **"AI calling campaigns"** (§6). Shipped.
- [x] Title, description, OG and Twitter tags (§6). Shipped.
- [x] Hero H1, eyebrow and subhead: shipped as candidate B, trimmed for one
      line per half (§4). Reasonable to revert if you'd rather ship A (PR #1)
      as-is and take the billing wedge as a loss on the hero specifically —
      but that reopens the exact gap §3 flags as differentiator #1.
- [x] Trust strip reframed to "Your keys, your bill —" (§5).
- [x] BYOK effort named in "How it works" step 02 (§1, §5).
- [x] OSS footer line added (§5).

Commercial — these are yours, and copy is blocked on them:

- [ ] Confirm or edit the mission statement (§1).
- [ ] Is zero-markup a permanent commitment? §3 recommends committing exactly
      as hard in messaging as policy already does. Hedged, it is worth less
      than not saying it.
- [ ] Confirm OSS as secondary (§3), or promote it to co-primary.
- [ ] Are the on-page numbers going to be replaced with measured ones (§4)? If
      not, they stay labelled as illustrative — that is not negotiable.

Asset:

- [ ] A 1200×630 social card (§6).
