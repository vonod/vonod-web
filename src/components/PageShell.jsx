import { ArrowRight } from 'lucide-react';
import { APP_URL } from '../lib/site';

/**
 * The only thing the three deep pages still share.
 *
 * There used to be a PageHero and a generic Section in here too, and all three
 * pages were built out of them: hero, band, bordered row grid, band, CTA. They
 * read as one page with the nouns swapped. Each page now lays itself out
 * around its own subject — a conversation unfolds in time, a run is a
 * pipeline, an API is a reference — and only the closing card is common,
 * because a consistent way to leave is site furniture, not sameness.
 */
export function PageCta({ title, body, label = 'Start building free' }) {
  return (
    <section className="max-w-content mx-auto px-6 py-xxl md:py-section">
      <div data-reveal className="reveal spotlight relative overflow-hidden card px-xl py-xxl md:py-section text-center">
        <div className="relative">
          <h2 className="text-display-sm sm:text-display-md lg:text-display-xl font-medium mb-md">{title}</h2>
          <p className="text-body text-body-md max-w-xl mx-auto mb-xl">{body}</p>
          <a href={APP_URL} className="btn-primary btn-lg group">
            {label}
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
