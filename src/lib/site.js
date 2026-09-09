// Shared bits every page needs. Extracted from LandingPage when the site went
// from one page to four — the landing owned all of this, which meant a second
// page could not exist without copying it.

import { useEffect } from 'react';

// Vite only rewrites absolute asset URLs inside index.html, so anything
// referenced from JSX has to go through here.
export const asset = (name) => `${import.meta.env.BASE_URL}${name}`;

// Where every CTA points. Set per-environment in the Pages workflow.
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://vonod-frontend.fly.dev';

// Scroll reveal. The only ambient motion the site allows: it plays once per
// element and never loops, because a marketing page that keeps moving reads
// consumer and this one sells to operations teams.
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!('IntersectionObserver' in window) || els.length === 0) {
      els.forEach((el) => el.classList.add('in'));
      return undefined;
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
