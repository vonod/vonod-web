/** Vonod marketing site.
 *
 * Tokens follow the Composio style reference (composio.dev) captured by
 * RicoUI: dark canvas, one deep-electric-blue voltage, Inter standing in for
 * abcDiatype. Every value here reads a CSS variable declared in src/index.css
 * so the token set has exactly one home.
 *
 * Naming note: `primary` is the brand BLUE, not the primary text colour.
 * Text is `ink` / `body-strong` / `body` / `muted`. `text-primary` would be
 * #0007cd on a near-black canvas — 1.7:1, invisible. Don't.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          active: 'var(--color-primary-active)',
          glow: 'var(--color-primary-glow)',
        },
        ink: 'var(--color-ink)',
        body: 'var(--color-body)',
        'body-strong': 'var(--color-body-strong)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          soft: 'var(--color-muted-soft)',
        },
        hairline: {
          DEFAULT: 'var(--color-hairline)',
          soft: 'var(--color-hairline-soft)',
          strong: 'var(--color-hairline-strong)',
        },
        canvas: {
          DEFAULT: 'var(--color-canvas)',
          deep: 'var(--color-canvas-deep)',
        },
        'surface-card': {
          DEFAULT: 'var(--color-surface-card)',
          elevated: 'var(--color-surface-card-elevated)',
        },
        'surface-strong': 'var(--color-surface-strong)',
        'on-primary': 'var(--color-on-primary)',
        'accent-cyan': 'var(--color-accent-cyan)',
        'accent-violet': 'var(--color-accent-violet)',
        error: 'var(--color-semantic-error)',
        success: 'var(--color-semantic-success)',
      },

      // The reference's 14 type steps. px → rem and px → em so the scale
      // honours the reader's browser font size; rendered size is unchanged.
      fontSize: {
        'display-mega': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-lg': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-md': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        'display-sm': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.0208em' }],
        'title-md': ['1.125rem', { lineHeight: '1.4' }],
        'title-sm': ['1rem', { lineHeight: '1.4' }],
        'body-md': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.8125rem', { lineHeight: '1.4' }],
        'caption-uppercase': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        code: ['0.8125rem', { lineHeight: '1.5' }],
        button: ['0.875rem', { lineHeight: '1' }],
        'nav-link': ['0.875rem', { lineHeight: '1.4' }],
      },

      fontFamily: {
        sans: ['abcDiatype', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },

      spacing: {
        xxs: 'var(--spacing-xxs)',
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        base: 'var(--spacing-base)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        xxl: 'var(--spacing-xxl)',
        section: 'var(--spacing-section)',
      },

      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },

      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
};
