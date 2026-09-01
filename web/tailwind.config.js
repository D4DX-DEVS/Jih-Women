/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Deep purple — headers, footer, hero overlays
        plum: {
          50: '#F6F1FB',
          100: '#EBE0F7',
          200: '#D4C0EE',
          300: '#B08FDE',
          400: '#8757C6',
          500: '#6733A8',
          600: '#512289',
          700: '#3F156C',
          800: '#2C0A4D',
          900: '#1E0637',
          950: '#140324',
        },
        // Magenta — primary actions and accents
        magenta: {
          50: '#FDF2F8',
          100: '#FCE4F0',
          200: '#F9C6DF',
          300: '#F49BC6',
          400: '#EE5FA3',
          500: '#E6187E',
          600: '#C71169',
          700: '#A20D55',
        },
        ink: {
          DEFAULT: '#241436',
          muted: '#6B5B7B',
          faint: '#9A8CA8',
        },
        mist: {
          DEFAULT: '#FAF7FC',
          deep: '#F3ECF8',
        },
      },
      fontFamily: {
        sans: ['Poppins', '"Anek Malayalam"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', '"Anek Malayalam"', 'Georgia', 'serif'],
        malayalam: ['"Anek Malayalam"', '"Noto Sans Malayalam"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(36,20,54,0.04), 0 10px 30px -14px rgba(36,20,54,0.22)',
        lift: '0 2px 6px rgba(36,20,54,0.06), 0 22px 46px -20px rgba(36,20,54,0.32)',
        card: '0 4px 24px -6px rgba(44,10,77,0.10)',
        pink: '0 8px 24px -8px rgba(230,24,126,0.55)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'zoom-slow': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.07)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'zoom-slow': 'zoom-slow 9s ease-out both',
      },
    },
  },
  plugins: [],
};
