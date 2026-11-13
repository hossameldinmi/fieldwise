export type StrategyId = 'A' | 'B' | 'C';
export interface Slot { year: number; season: 'winter' | 'summer'; cropId: string }
export interface Strategy { id: StrategyId; years: number; slots: Slot[] }

const seq = (ids: string[]): Slot[] =>
  ids.map((cropId, i) => ({ year: Math.floor(i / 2), season: i % 2 === 0 ? 'winter' : 'summer', cropId }));

/** The three standard strategies. Each agricultural year starts 1 October with the winter season (عروة شتوية). */
export const STRATEGIES: Strategy[] = [
  { id: 'A', years: 2, slots: seq(['wheat', 'maize', 'wheat', 'maize']) },
  { id: 'B', years: 2, slots: seq(['wheat', 'maize', 'faba_bean', 'sunflower']) },
  { id: 'C', years: 4, slots: seq(['potato', 'maize', 'faba_bean', 'sorghum', 'onion', 'soybean', 'wheat', 'sunflower']) },
];
