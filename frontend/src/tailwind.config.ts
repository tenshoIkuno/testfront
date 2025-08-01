// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shadowShrink: {
          '0%': { transform: 'scaleX(1.5)', opacity: '1' },
          '40%': { transform: 'scaleX(1)', opacity: '0.7' },
          '100%': { transform: 'scaleX(0.2)', opacity: '0.4' },
        },
      },
      animation: {
        shadowShrink: 'shadowShrink 0.5s alternate infinite ease',
      },
    },
  },
  plugins: [],
}

export default config
