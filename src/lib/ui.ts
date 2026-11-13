import type { Note } from './types';

/** Light family tints for season cells; text on them stays ink. */
export const FAMILY_COLORS: Record<string, string> = {
  Poaceae: '#EADFB9',
  Fabaceae: '#CDE5D4',
  Solanaceae: '#F4D2C4',
  Amaryllidaceae: '#E3D5EE',
  Asteraceae: '#F7E2A0',
};
export const familyColor = (f: string) => FAMILY_COLORS[f] ?? '#E6E9E3';

export const STRATEGY_COLORS = { A: '#6B7570', B: '#1D6B47', C: '#C2630A', D: '#7B4FA0' } as const;
/** Radar/legend stroke pattern per strategy, so options differ by more than hue. */
export const STRATEGY_DASH = { A: '6 4', B: undefined, C: undefined, D: '2 3' } as const;

export type Status = 'pass' | 'watch' | 'fail' | 'synced';
export const statusOf = (level: Note['level']): Status => (level === 'risk' ? 'fail' : level === 'warn' ? 'watch' : 'pass');

/** Box, heading and body colors per status (box bg, border, heading, body text, badge bg). */
export const STATUS_STYLE: Record<Status, { bg: string; line: string; head: string; body: string; badge: string }> = {
  synced: { bg: '#E3EDF7', line: '#B8CFE6', head: '#174A78', body: '#1E3A56', badge: '#E3EDF7' },
  pass: { bg: '#E3EFE7', line: '#B5D3C0', head: '#134A31', body: '#1F3B2C', badge: '#CFE6D7' },
  watch: { bg: '#FBEEDD', line: '#EBCB9F', head: '#8A4205', body: '#4F2A08', badge: '#FBEEDD' },
  fail: { bg: '#F9E0DC', line: '#E8B4AC', head: '#9B2C1F', body: '#4A1510', badge: '#F9E0DC' },
};

export const scoreColor = (s: number) => (s >= 75 ? '#134A31' : s >= 50 ? '#15201B' : '#9B2C1F');
