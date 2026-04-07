/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0D0F14',
          light: '#131620',
          lighter: '#1A1D2B',
        },
        amber: {
          DEFAULT: '#F5A623',
          light: '#F7B84E',
          dark: '#D48B0F',
          glow: 'rgba(245, 166, 35, 0.25)',
        },
        cyan: {
          DEFAULT: '#00D4FF',
          light: '#33DDFF',
          dark: '#00A3CC',
          glow: 'rgba(0, 212, 255, 0.25)',
        },
        success: '#22C55E',
        warning: '#FACC15',
        danger: '#EF4444',
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          light: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        text: {
          primary: '#F1F5F9',
          muted: '#64748B',
        },
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'meteor-effect': "meteor 5s linear infinite",
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px rgba(245, 166, 35, 0.3)' },
          '50%': { opacity: 0.6, boxShadow: '0 0 20px rgba(245, 166, 35, 0.1)' },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
}
