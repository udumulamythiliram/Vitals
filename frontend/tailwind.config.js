/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          contrast: 'var(--primary-contrast)',
          hover: 'var(--primary-hover)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
          text: 'var(--success-text)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
          text: 'var(--warning-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          bg: 'var(--danger-bg)',
          text: 'var(--danger-text)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        theme: 'var(--radius)',
      },
      boxShadow: {
        theme: 'var(--shadow)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'var(--font-sans)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
