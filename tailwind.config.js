/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Dokan brand palette — warm saffron + deep charcoal for Bahrain market
        brand: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // primary saffron
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        surface: {
          DEFAULT: '#0f0e0c',   // near-black background
          card:    '#1a1916',   // card background
          border:  '#2a2825',   // subtle border
          muted:   '#3a3835',   // muted surface
        },
        text: {
          primary:   '#fafaf9',
          secondary: '#a8a29e',
          muted:     '#57534e',
        },
        status: {
          pending:   { bg: '#1c1917', text: '#a8a29e', border: '#292524' },
          confirmed: { bg: '#1a2e1a', text: '#86efac', border: '#14532d' },
          preparing: { bg: '#1c1406', text: '#fcd34d', border: '#713f12' },
          ready:     { bg: '#0f2d2d', text: '#5eead4', border: '#134e4a' },
          completed: { bg: '#1a1a2e', text: '#a5b4fc', border: '#1e1b4b' },
          cancelled: { bg: '#2a1010', text: '#fca5a5', border: '#7f1d1d' },
        },
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cabinet)', 'system-ui', 'sans-serif'],
        arabic:  ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'ping-slow':  'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-dark':  'linear-gradient(180deg, #1a1916 0%, #0f0e0c 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function ({ addVariant }) {
      addVariant('rtl', '[dir="rtl"] &');
      addVariant('ltr', '[dir="ltr"] &');
    }),
  ],
};
