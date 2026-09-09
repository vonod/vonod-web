// Every page mounts this once. It was LandingStyles, inline at the bottom of
// LandingPage — which meant the deep pages would have rendered with no reveal
// transition and no prompt caret.

export default function SiteStyles() {
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

      /* A thin spinner for an in-flight tool call — reads as a system doing
         work, where the pulsing dot it replaced read closer to a chat "typing"
         indicator, which is the wrong register for an ops tool. */
      .lp-spin { width:10px; height:10px; border-radius:9999px; flex-shrink:0;
        border:1.5px solid var(--color-hairline-strong); border-top-color: var(--color-ink);
        animation: lp-spin .8s linear infinite; }
      @keyframes lp-spin { to { transform: rotate(360deg); } }

      /* Pop-in for the checkmark that replaces the spinner once a tool call
         finishes, so the state change reads as an event, not a silent swap. */
      .lp-pop { animation: lp-pop .3s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes lp-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      /* Older transcript lines used to be chopped off mid-glyph at the top of
         the fixed-height rail, which read as a rendering bug rather than as
         scrollback. They now fade out into the card instead. */
      .lp-tx { -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 34px, #000 100%);
               mask-image: linear-gradient(to bottom, transparent 0, #000 34px, #000 100%); }

      /* The workflow canvas prompt's cursor. Steady, like the transcript's —
         a blink would be the only thing on the page moving at rest. */
      .wf-caret { display:inline-block; width:2px; height:0.95em; margin-left:2px; vertical-align:-1px;
                  border-radius:1px; background: var(--color-ink); opacity:.7; }

      /* Steady (non-blinking) streaming cursor while a line is being spoken. */
      .lp-caret { display:inline-block; width:2px; height:0.95em; margin-left:2px; vertical-align:-1px; border-radius:1px; opacity:.75; }

      @media (prefers-reduced-motion: reduce) {
        .lp-spin, .lp-pop { animation: none !important; }
        [data-reveal].reveal { opacity:1 !important; transform:none !important; transition:none !important; }
      }
    `}</style>
  );
}
