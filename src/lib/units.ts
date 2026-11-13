import type { AreaUnit } from './types';

/** Hectares per unit. 1 feddan = 4200.83 m². 1 acre = 4046.86 m². */
export const HECTARES_PER: Record<AreaUnit, number> = { feddan: 0.420083, hectare: 1, acre: 0.404686 };

export const toHectares = (value: number, unit: AreaUnit) => value * HECTARES_PER[unit];
export const convertArea = (value: number, from: AreaUnit, to: AreaUnit) =>
  (value * HECTARES_PER[from]) / HECTARES_PER[to];
