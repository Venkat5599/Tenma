/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Terminal Palette
        'void-black': '#000000',
        'canvas-white': '#ffffff',
        'ash-gray': '#a3a3a3',
        'coal': '#171717',
        'iron': '#262626',
        'frost': '#f5f5f5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '24px',
        '2xl': '30px',
        '3xl': '36px',
        '4xl': '48px',
      },
      letterSpacing: {
        'tighter': '-0.025em',
        'tight': '-0.015em',
        'normal': '0.01em',
        'wide': '0.015em',
        'wider': '0.1em',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '14px',
        'xl': '32px',
      },
      spacing: {
        '18': '72px',
      },
      boxShadow: {
        'midnight': 'rgba(0,0,0,0.1) 0px 1px 6px 0px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
