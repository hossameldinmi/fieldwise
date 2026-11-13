import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        silt: '#33291F',      // Nile silt — body text
        siltSoft: '#6B5D4D',
        sheet: '#F5F7F2',     // field-sheet paper, faint green
        line: '#D9DED3',
        berseem: '#2E6B3C',   // primary action
        canal: '#1E5A73',     // water / data
        straw: '#B8921F',     // caution
        blight: '#962F2F',    // risk
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
