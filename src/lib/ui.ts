export const FAMILY_COLORS: Record<string, string> = {
  Poaceae: '#C9B06B',
  Fabaceae: '#3F7D4B',
  Solanaceae: '#6A4C7A',
  Amaryllidaceae: '#A8743C',
  Asteraceae: '#E0B12A',
};
export const familyColor = (f: string) => FAMILY_COLORS[f] ?? '#8A9A8C';
export const familyInk = (f: string) => (['Fabaceae', 'Solanaceae', 'Amaryllidaceae'].includes(f) ? '#FFFFFF' : '#2B2218');
export const STRATEGY_COLORS = { A: '#8C7B66', B: '#2E6B3C', C: '#1E5A73' } as const;

export const scoreTone = (s: number) => (s >= 75 ? 'text-berseem' : s >= 50 ? 'text-silt' : 'text-blight');
