/** Vonod marketing site — brand tokens mirrored from the app so the look stays
 * identical, but self-contained (this project does not import app code). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vonod: {
          bg: 'var(--bg-primary)',
          surface: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          border: 'var(--border-color)',
          'border-hover': 'var(--border-hover)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          accent: 'var(--accent)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      letterSpacing: { tighter: '-0.02em', tight: '-0.01em' },
    },
  },
  plugins: [],
};
