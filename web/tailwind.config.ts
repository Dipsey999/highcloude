import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
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
      },
    },
  },
  plugins: [],
};

export default config;
