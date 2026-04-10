/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', '"Segoe UI Variable Display"', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Segoe UI Variable Text"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', '"SFMono-Regular"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(148, 163, 184, 0.08), 0 24px 80px rgba(2, 6, 23, 0.55)',
      },
      colors: {
        panel: {
          DEFAULT: 'rgba(15, 23, 42, 0.72)',
          strong: 'rgba(2, 6, 23, 0.92)',
        },
      },
    },
  },
  plugins: [],
};
