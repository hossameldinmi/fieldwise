import type { ClimateProfile } from '../types';

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const MID_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

/** Day of year (1..365) -> month index 0..11. */
export function monthOfDoy(doy: number): number {
  for (let m = 11; m >= 0; m--) if (doy > MONTH_START[m]) return m;
  return 0;
}

export function doyToDate(doy: number): { month: number; day: number } {
  const m = monthOfDoy(doy);
  return { month: m, day: doy - MONTH_START[m] };
}

/** FAO-56 eq. 21: extraterrestrial radiation Ra (MJ m-2 day-1). */
export function extraterrestrialRadiation(latDeg: number, doy: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  return ((24 * 60) / Math.PI) * 0.082 * dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}

/** Hargreaves–Samani reference ET0 (mm/day) for each month. */
export function monthlyPET(c: ClimateProfile): number[] {
  return c.months.map((m, i) => {
    const ra = extraterrestrialRadiation(c.lat, MID_DOY[i]);
    return 0.0023 * 0.408 * ra * (m.t2m + 17.8) * Math.sqrt(Math.max(0, m.tmax - m.tmin));
  });
}

/** FAO/AGLW empirical effective rainfall for a monthly total (mm). */
export function effectiveRain(pMonthMm: number): number {
  return pMonthMm > 75 ? 0.8 * pMonthMm - 25 : Math.max(0, 0.6 * pMonthMm - 10);
}

export function annualWaterBalance(c: ClimateProfile) {
  const pet = monthlyPET(c);
  let p = 0, e = 0;
  c.months.forEach((m, i) => { p += m.precMmDay * MONTH_DAYS[i]; e += pet[i] * MONTH_DAYS[i]; });
  return { precipMm: p, petMm: e, deficitMm: p - e };
}
