import type { ClimateProfile, MonthClimate } from '../types';

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

/** FAO-56 eq. 11: saturation vapour pressure (kPa) at T °C. */
const satVp = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));

export type EtMethod = 'penman_monteith' | 'hargreaves';

/** Penman-Monteith needs wind, humidity and radiation; older/fixture profiles fall back to Hargreaves. */
export const etMethod = (c: ClimateProfile): EtMethod =>
  c.months.every((m) => m.ws2m !== undefined && m.dewC !== undefined) ? 'penman_monteith' : 'hargreaves';

/**
 * FAO-56 Penman-Monteith reference ET0 (mm/day) for one month (eqs. 6, 7, 8, 13, 37–40, 43).
 * `tPrev` is the previous month's mean, for soil heat flux G = 0.14 (Ti − Ti−1).
 */
export function penmanMonteith(m: MonthClimate, latDeg: number, doy: number, elevationM: number, tPrev: number): number {
  const u2 = m.ws2m ?? 2;
  const P = 101.3 * ((293 - 0.0065 * elevationM) / 293) ** 5.26;
  const gamma = 0.000665 * P;
  const es = (satVp(m.tmax) + satVp(m.tmin)) / 2;
  const ea = Math.min(es, satVp(m.dewC ?? m.tmin));
  const delta = (4098 * satVp(m.t2m)) / (m.t2m + 237.3) ** 2;
  const ra = extraterrestrialRadiation(latDeg, doy);
  const rso = (0.75 + 2e-5 * elevationM) * ra;
  const rs = Math.min(m.radMJ, rso);
  const rnl = 4.903e-9 * (((m.tmax + 273.16) ** 4 + (m.tmin + 273.16) ** 4) / 2) *
    (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * (rso > 0 ? rs / rso : 1) - 0.35);
  const rn = 0.77 * rs - rnl;
  const g = 0.14 * (m.t2m - tPrev);
  const et0 = (0.408 * delta * (rn - g) + gamma * (900 / (m.t2m + 273)) * u2 * (es - ea)) / (delta + gamma * (1 + 0.34 * u2));
  return Math.max(0, et0);
}

/** Reference ET0 (mm/day) for each month: Penman-Monteith when POWER wind and dew point are present, else Hargreaves–Samani. */
export function monthlyPET(c: ClimateProfile): number[] {
  const pm = etMethod(c) === 'penman_monteith';
  return c.months.map((m, i) => {
    if (pm) return penmanMonteith(m, c.lat, MID_DOY[i], c.elevationM ?? 0, c.months[(i + 11) % 12].t2m);
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
