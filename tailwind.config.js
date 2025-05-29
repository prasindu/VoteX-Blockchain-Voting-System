/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./dist/*.{html,js}"],
  theme: {
    extend: {
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

