import { useEffect, useRef } from 'react';

/**
 * Dotted planet Earth (real continents) used as the hero's FLOOR, with marker
 * dots pulsing across it to evoke a massive, worldwide call campaign.
 *
 * It sits sunk below the copy rather than behind it. Behind the copy it lost
 * the fight with the outlined half of the headline — a 1.5px white stroke over
 * white dots is noise — so the sphere is dropped until only its top arc clears
 * the hero's bottom edge, and a mask fades even that up out of the black. It
 * touches no letter, and "everyone" gets the curve of the planet underneath it.
 *
 * Built on `cobe` (~5 KB, GPU/WebGL) instead of three.js so it (a) actually
 * renders Earth's landmasses out of the box and (b) keeps Lighthouse happy:
 *   - cobe is dynamically imported, so it stays out of the initial bundle and
 *     never blocks first paint / LCP (the hero text paints first).
 *   - Only runs while the hero is on-screen (IntersectionObserver create/destroy).
 *   - Honors prefers-reduced-motion: a still globe, no animation loop.
 *   - Caps devicePixelRatio and uses a contained, fixed-size square canvas, so
 *     there is no layout shift (CLS) and no oversized buffers.
 *
 * NOTE: cobe caps markers at 63 (its uniform array holds 64*2 vec4 and each
 * marker takes 2, plus a terminator). Keep CITIES ≤ 63 or the last entries are
 * silently dropped. The list below is balanced across every region so the globe
 * reads as genuinely global, not US/Europe-centric.
 */

// Major metros worldwide (lat, lng) — where "calls" light up. Balanced by
// region; total kept under cobe's 63-marker limit.
const CITIES = [
  // North America
  [40.71, -74.0], [34.05, -118.24], [41.88, -87.63], [43.65, -79.38], [49.28, -123.12],
  [37.77, -122.42], [25.76, -80.19], [19.43, -99.13],
  // South America
  [-23.55, -46.63], [-22.91, -43.17], [-34.6, -58.38], [4.71, -74.07], [-33.45, -70.67],
  [-12.05, -77.04],
  // Europe
  [51.51, -0.13], [48.86, 2.35], [40.42, -3.7], [41.39, 2.17], [52.52, 13.4],
  [41.9, 12.5], [38.72, -9.14], [52.37, 4.9], [59.33, 18.06], [55.75, 37.62],
  [41.0, 28.98],
  // Africa
  [30.04, 31.24], [33.57, -7.59], [6.52, 3.37], [-1.29, 36.82], [-26.2, 28.04],
  [-33.92, 18.42], [5.6, -0.19], [9.03, 38.74],
  // Middle East / Arabia
  [25.2, 55.27], [24.71, 46.68], [25.29, 51.53], [32.08, 34.78], [35.69, 51.39],
  [21.49, 39.19],
  // South Asia
  [19.08, 72.88], [28.61, 77.21], [12.97, 77.59], [24.86, 67.01], [23.81, 90.41],
  // South-East Asia
  [1.35, 103.82], [13.75, 100.5], [-6.21, 106.85], [3.14, 101.69], [14.6, 120.98],
  [10.82, 106.63],
  // East Asia
  [39.9, 116.41], [31.23, 121.47], [22.32, 114.17], [23.13, 113.26], [25.03, 121.57],
  [37.57, 126.98], [35.68, 139.69],
  // Oceania
  [-33.87, 151.21], [-37.81, 144.96], [-31.95, 115.86], [-27.47, 153.03], [-36.85, 174.76],
];

// Where the sphere sits, all as fractions of its own diameter so the horizon
// holds its shape at every viewport width.
//
// ARC is how much of the top clears the hero's bottom edge; the mask then
// hides everything above MASK_CLEAR and is at full strength by MASK_SOLID. The
// band that actually shows is therefore 14.5%–21% down the sphere — far enough
// from the pole to carry continents, close enough to the top to still read as
// a curve rather than a stripe. Showing the polar cap instead looks empty.
const ARC = 0.21;
const MASK = 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 14.5%, rgba(0,0,0,1) 21%)';

export default function GlobeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const parent = canvas.parentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let globe = null;
    let phi = 0;
    let size = 0;            // CSS px (square)
    let raf = 0;
    let destroyed = false;

    // Per-marker pulse params so "calls" fire in/out at staggered times.
    const markers = CITIES.map(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 0.9,
      amp: 0.03 + Math.random() * 0.05,
    }));

    const measure = () => {
      const w = parent?.offsetWidth || window.innerWidth;
      // Big enough to read as a planet, capped so buffers stay modest. Only
      // the ARC band is ever on screen, so there is nothing to gain from a
      // sphere much wider than the viewport.
      // The floor is 720 so the arc still reads as a curve on a phone: at a
      // 390px viewport a sphere scaled to the viewport would show a dome barely
      // 60px tall, which looks like a smudge rather than a planet.
      size = Math.min(Math.max(w * 1.15, 720), 1400);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      // Sink it so only that band clears the hero's bottom edge.
      canvas.style.bottom = `${-size * (1 - ARC)}px`;
    };

    const create = async () => {
      if (globe || destroyed) return;
      const { default: createGlobe } = await import('cobe');
      if (destroyed) return;
      measure();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const px = size * dpr;
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: px,
        height: px,
        phi: 0,
        theta: 0.22,
        // Dark-only site, monochrome globe: gray landmasses, white call
        // markers, a barely-there neutral atmosphere. No hue anywhere.
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 5.5,
        baseColor: [0.32, 0.32, 0.34],
        markerColor: [1, 1, 1],
        glowColor: [0.13, 0.13, 0.14],
        markers: CITIES.map((location) => ({ location, size: 0.04 })),
        onRender: (state) => {
          if (!reduce) phi += 0.0035;
          state.phi = phi;
          state.width = px;
          state.height = px;
          const t = performance.now() / 1000;
          state.markers = CITIES.map((location, i) => {
            const m = markers[i];
            const pulse = reduce ? 0.5 : Math.max(0, Math.sin(t * m.speed + m.phase));
            return { location, size: 0.018 + pulse * m.amp };
          });
        },
      });
      // Fade in once the first frame is up (avoids a hard pop).
      requestAnimationFrame(() => { if (!destroyed) canvas.style.opacity = '0.85'; });
    };

    const destroy = () => {
      if (globe) { globe.destroy(); globe = null; }
      canvas.style.opacity = '0';
    };

    // Only run while the hero is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible) create();
        else destroy();
      },
      { rootMargin: '120px' },
    );
    // Observe the WRAPPER, not the canvas: `contain: strict` plus a size that
    // is only set once create() runs leaves the canvas 0x0, and a zero-area
    // element never reports as intersecting — so observing it here meant the
    // globe intermittently never started at all.
    io.observe(parent ?? canvas);

    let resizeT;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => { if (globe) { destroy(); create(); } }, 250);
    };
    window.addEventListener('resize', onResize);

    return () => {
      destroyed = true;
      io.disconnect();
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeT);
      cancelAnimationFrame(raf);
      destroy();
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          opacity: 0,
          transition: 'opacity 1.1s ease',
          contain: 'strict',   // isolate the bg canvas from layout/paint
          maxWidth: 'none',
          // Fade the arc up out of the floor. Without this the sphere starts
          // on a hard edge and the dots collide with the copy above it.
          WebkitMaskImage: MASK,
          maskImage: MASK,
        }}
      />
    </div>
  );
}
