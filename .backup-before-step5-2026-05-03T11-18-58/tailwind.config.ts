import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { care: { 50: '#f7fbff', 100: '#e7f2ff', 500: '#2d72d9', 700: '#1d4f9a' } },
      boxShadow: { soft: '0 18px 48px rgba(15,23,42,0.08)' }
    }
  },
  plugins: []
}
export default config
