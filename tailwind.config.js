/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./dist/*.{html,js}"],
  theme: {
    extend: {
      animation: {
        'neon-snake': 'snakeMotion 20s linear infinite',
      },
      keyframes: {
        snakeMotion: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      fontFamily: {
        hacker: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        darkbg: '#0b0b0b',
        dark: '#0f172a',
        card: '#1e293b',
        'neon-purple': '#e100ff',
        'neon-cyan': '#00ffff',
        'neon-pink': '#ff1493',
      },
    },
  },
  plugins: [],
}