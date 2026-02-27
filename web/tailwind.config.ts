import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f4ff',
          100: '#b3dfff',
          200: '#80caff',
          300: '#4db5ff',
          400: '#1aa0ff',
          500: '#0d99ff',
          600: '#0a7acc',
          700: '#085c99',
          800: '#053d66',
          900: '#031f33',
        },
        success: '#14ae5c',
        error: '#f24822',
        warning: '#ffcd29',
        // Semantic tokens referencing CSS variables
        surface: {
          DEFAULT: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
          glass: 'var(--bg-glass)',
        },
        edge: {
          DEFAULT: 'var(--border-primary)',
          accent: 'var(--border-accent)',
        },
        content: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
      },
      boxShadow: {
        glow: '0 0 20px var(--brand-glow)',
        'glow-lg': '0 0 40px var(--brand-glow)',
        elevated: '0 4px 24px var(--shadow-color, rgba(0,0,0,0.06))',
        'elevated-lg': '0 8px 40px var(--shadow-color, rgba(0,0,0,0.08))',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px var(--brand-glow)' },
          '50%': { boxShadow: '0 0 40px var(--brand-glow)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
