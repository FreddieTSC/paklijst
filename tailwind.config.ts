import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Editorial palette: warm paper, deep ink, mossy accent
        paper:   '#f5f3ee',
        paperX:  '#ebe8df',
        ink:     '#1a1f1c',
        muted:   '#6b6f68',
        rule:    '#d8d4c8',
        accent:  '#2c4a32',     // deep moss
        accent2: '#a83a2e',     // burnt vermillion (destructive)
        flag:    '#d4a82e',     // mustard accent for badges
      },
      fontFamily: {
        sans:    ['"Geist Variable"', 'system-ui', 'sans-serif'],
        display: ['"Geist Variable"', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Editorial scale: bigger jumps for hierarchy
        'display':  ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'h1':       ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'h2':       ['1.375rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'eyebrow':  ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '6px',
        'lg':  '10px',
      },
      boxShadow: {
        'card':  '0 1px 0 rgba(26, 31, 28, 0.06), 0 8px 24px -12px rgba(26, 31, 28, 0.12)',
        'press': 'inset 0 1px 0 rgba(0,0,0,0.04)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
