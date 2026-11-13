import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15201B',        // body text
        sub: '#3F4A44',        // labels, secondary text
        muted: '#4F5B55',      // captions
        paper: '#F5F6F1',      // page background
        line: '#DCE0D8',       // card borders
        field: '#C9CFC6',      // input borders
        soft: '#E6E9E3',       // row dividers
        track: '#EEF0EB',      // bar tracks
        green: { DEFAULT: '#1D6B47', dark: '#134A31', tint: '#E3EFE7', line: '#B5D3C0', ink: '#1F3B2C' },
        blue: { DEFAULT: '#174A78', deep: '#1F5F99', tint: '#E3EDF7', line: '#B8CFE6', ink: '#1E3A56' },
        amber: { DEFAULT: '#8A4205', tint: '#FBEEDD', line: '#EBCB9F', ink: '#4F2A08', orange: '#C2630A' },
        plum: { DEFAULT: '#5B2F7A', tint: '#FBF4FF', line: '#DCCBEA', band: '#EFE7F5', ink: '#3A1F4E' },
        red: { DEFAULT: '#9B2C1F', tint: '#FBE9E7', line: '#E9B8B0' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
