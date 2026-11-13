import type { Crop } from '../types';
import type { Slot, Strategy } from './strategies';

/** Agricultural-year day index: day 0 = 1 October (DOY 274) of rotation year 0. */
export const AG_YEAR_START_DOY = 274;
export const MIN_PREP_DAYS = 14;
export const TARGET_PREP_DAYS = 21;

export const toAgDay = (doy: number, year: number) => ((doy - AG_YEAR_START_DOY + 365) % 365) + year * 365;
export const agDayToDoy = (agDay: number) => ((((agDay % 365) + 365) % 365) + AG_YEAR_START_DOY - 1) % 365 + 1;

export interface Planting {
  index: number;
  slot: Slot;
  crop: Crop;
  sow: number;      // ag-day
  harvest: number;  // ag-day
  gapBefore: number; // days of fallow/prep before sowing (cyclic for index 0)
  daysLate: number;  // days sown after end of sowing window
}

/**
 * Deterministic scheduler: sow on the preferred date unless the previous harvest plus land
 * preparation (max of 14 days and the crop's prep weeks) forces a later date.
 */
export function buildSchedule(strategy: Strategy, crops: Map<string, Crop>): Planting[] {
  const out: Planting[] = [];
  let prevHarvest = -Infinity;
  strategy.slots.forEach((slot, index) => {
    const crop = crops.get(slot.cropId);
    if (!crop) throw new Error(`Strategy ${strategy.id} references unknown crop "${slot.cropId}"`);
    const prep = Math.max(MIN_PREP_DAYS, crop.prepWeeks * 7);
    const preferred = toAgDay(crop.sowDoy, slot.year);
    const sow = Math.max(preferred, prevHarvest + prep);
    const latest = toAgDay(crop.sowWindow[1], slot.year);
    const harvest = sow + crop.durationDays;
    out.push({ index, slot, crop, sow, harvest, gapBefore: Number.isFinite(prevHarvest) ? sow - prevHarvest : 0, daysLate: Math.max(0, sow - latest) });
    prevHarvest = harvest;
  });
  if (out.length) out[0].gapBefore = out[0].sow + strategy.years * 365 - out[out.length - 1].harvest;
  return out;
}
