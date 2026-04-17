/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#0D1117',
        card: '#111827',
        elevated: '#1F2937',
        teal: '#00C896',
        'brand-blue': '#3B82F6',
        'brand-amber': '#F59E0B',
        'brand-red': '#EF4444',
        'brand-purple': '#8B5CF6',
        'brand-green': '#10B981',
        'text-primary': '#F1F5F9',
        'text-muted': '#94A3B8',
        'border-dark': '#1E293B',
        'sidebar-bg': '#0A0F1A',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'flash-green': 'flash-green 800ms ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'count-up': 'countUp 1.2s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(239, 68, 68, 0.3)' },
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgba(0, 200, 150, 0.15)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
