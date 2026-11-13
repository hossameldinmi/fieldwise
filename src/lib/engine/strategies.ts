export type StrategyId = 'A' | 'B' | 'C' | 'D';
export interface Slot { year: number; season: 'winter' | 'summer'; cropId: string }
export interface Strategy { id: StrategyId; years: number; slots: Slot[] }

/** Alternating winter/summer slots, two per agricultural year. */
export const seq = (ids: string[]): Slot[] =>
  ids.map((cropId, i) => ({ year: Math.floor(i / 2), season: i % 2 === 0 ? 'winter' : 'summer', cropId }));

/** The three standard strategies. Each agricultural year starts 1 October with the winter season (عروة شتوية). */
export const STRATEGIES: Strategy[] = [
  { id: 'A', years: 2, slots: seq(['wheat', 'maize', 'wheat', 'maize']) },
  { id: 'B', years: 2, slots: seq(['wheat', 'maize', 'faba_bean', 'sunflower']) },
  { id: 'C', years: 4, slots: seq(['potato', 'maize', 'faba_bean', 'sorghum', 'onion', 'soybean', 'wheat', 'sunflower']) },
];

export interface CurrentRotation { winter: string; summer: string }

/**
 * Strategies compared for one farm: A is the farmer's current rotation (the baseline),
 * B and C are the standard alternatives, D is the farmer's own custom sequence.
 */
export function farmStrategies(current: CurrentRotation, custom: string[]): Strategy[] {
  const [, b, c] = STRATEGIES;
  const out: Strategy[] = [
    { id: 'A', years: 2, slots: seq([current.winter, current.summer, current.winter, current.summer]) },
    b,
    c,
  ];
  if (custom.length >= 2 && custom.length % 2 === 0) out.push({ id: 'D', years: custom.length / 2, slots: seq(custom) });
  return out;
}
