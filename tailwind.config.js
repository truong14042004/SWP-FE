/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: [
    './src/features/home/**/*.{js,jsx}',
    './src/features/auth/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        actionBlue: {
          DEFAULT: '#0066cc',
          focus:   '#0071e3',
          onDark:  '#2997ff',
          soft:    '#e6f0ff',
        },
        ink: {
          DEFAULT:  '#1d1d1f',
          80:       '#333333',
          48:       '#6e6e73',
        },
        canvas:    '#ffffff',
        parchment: '#f5f5f7',
        pearl:     '#fafafc',
        tile1:     '#1d1d1f',
        tile2:     '#2a2a2c',
        tile3:     '#161617',
        hairline:  '#d2d2d7',
        soft:      '#f0f0f0',
        danger: {
          DEFAULT: '#b42318',
          fill:    '#fdf3f1',
          border:  '#f1b8ad',
        },
        success: {
          DEFAULT: '#17633a',
          fill:    '#f1fbf5',
          border:  '#b7d8c4',
        },
      },
      fontFamily: {
        display: ['"SF Pro Display"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        text:    ['"SF Pro Text"',    'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      letterSpacing: {
        body:  '-0.224px',
        title: '-0.374px',
      },
      borderRadius: {
        pill: '9999px',
        md:   '12px',
        lg:   '18px',
        xl:   '28px',
      },
      boxShadow: {
        product: 'rgba(0,0,0,0.22) 3px 5px 30px 0',
        card:    '0 16px 40px -24px rgba(15,23,42,0.18)',
        cardLg:  '0 22px 50px -28px rgba(15,23,42,0.22)',
        hero:    '0 24px 60px -28px rgba(15,23,42,0.32)',
      },
      backdropBlur: {
        frost: '20px',
      },
      keyframes: {
        progressPulse: {
          'from': { width: '38%' },
          'to':   { width: '78%' },
        },
        ringPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(0,102,204,0.4)' },
          '100%': { boxShadow: '0 0 0 8px rgba(0,102,204,0)' },
        },
        floatOrb: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-24px)' },
        },
        revealUp: {
          'from': { opacity: 0, transform: 'translateY(20px)' },
          'to':   { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        progressPulse: 'progressPulse 2.6s ease-in-out infinite alternate',
        ringPulse:     'ringPulse 1.6s ease-in-out infinite',
        floatOrb:      'floatOrb 14s ease-in-out infinite',
        revealUp:      'revealUp 700ms ease both',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
