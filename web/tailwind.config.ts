import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c9ff',
          300: '#b5a1ff',
          400: '#9c7afa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0f7a',
        },
        cosmic: {
          void: '#0a0a0f',
          deep: '#0f0f17',
          nebula: '#161621',
          surface: '#12121c',
        },
        nebula: {
          pink: 'var(--nebula-pink)',
          blue: 'var(--nebula-blue)',
          cyan: 'var(--nebula-cyan)',
        },
        star: {
          gold: 'var(--star-gold)',
          white: 'var(--star-white)',
        },
        success: '#16a34a',
        error: '#dc2626',
        warning: '#d97706',
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
        glow: '0 0 16px var(--brand-glow)',
        'glow-lg': '0 0 32px var(--brand-glow)',
        cosmic: '0 4px 24px rgba(124, 58, 237, 0.1), 0 0 48px rgba(6, 182, 212, 0.05)',
        'cosmic-lg': '0 8px 40px rgba(124, 58, 237, 0.15), 0 0 80px rgba(6, 182, 212, 0.08)',
        elevated: '0 2px 16px var(--shadow-color, rgba(0,0,0,0.04))',
        'elevated-lg': '0 4px 32px var(--shadow-color, rgba(0,0,0,0.06))',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-in': 'fadeInUp 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'glow-pulse': 'pulseGlow 3s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'twinkle-slow': 'twinkle-slow 5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px var(--brand-glow)' },
          '50%': { boxShadow: '0 0 32px var(--brand-glow)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
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
