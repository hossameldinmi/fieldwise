import { describe, expect, it } from 'vitest';
import { etMethod, monthlyPET, penmanMonteith } from '../src/lib/nasa/climate';
import { parseClimatology } from '../src/lib/nasa/power';
import { BARE_NDVI, parseSubsets, requestWindows, summarizeNdvi } from '../src/lib/nasa/modis';
import { deltaClimate } from './fixtures';

describe('Penman-Monteith ET0', () => {
  it('reproduces FAO-56 Example 17 (Bangkok, April) within 0.2 mm/day', () => {
    // Tmax 34.8, Tmin 25.6, ea 2.85 kPa (dew point ≈ 23.2 °C), u2 2 m/s, Rs 22.65 MJ/m²/day, z 2 m, March mean 29.2 °C.
    const et0 = penmanMonteith({ t2m: 30.2, tmax: 34.8, tmin: 25.6, dewC: 23.24, ws2m: 2, radMJ: 22.65, precMmDay: 0, rh: 70 }, 13.73, 105, 2, 29.2);
    expect(et0).toBeGreaterThan(5.5);
    expect(et0).toBeLessThan(5.9);
  });
  it('falls back to Hargreaves without wind and dew point', () => {
    expect(etMethod(deltaClimate)).toBe('hargreaves');
    expect(monthlyPET(deltaClimate).every((v) => v > 0)).toBe(true);
  });
});

describe('NASA POWER parsing', () => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const flat = (v: number) => Object.fromEntries(months.map((m) => [m, v]));
  const json = {
    geometry: { coordinates: [30.9, 31.1, 5] },
    parameters: { ALLSKY_SFC_SW_DWN: { units: 'MJ/m^2/day' } },
    properties: { parameter: {
      T2M: flat(20), T2M_RANGE: flat(12), T2M_MAX: flat(40), T2M_MIN: flat(2), PRECTOTCORR: flat(0.1), RH2M: flat(60),
      ALLSKY_SFC_SW_DWN: flat(20), WS2M: flat(2.5), T2MDEW: flat(10), GWETROOT: flat(0.4), GWETTOP: flat(0.2), FROST_DAYS: flat(0),
    } },
  };
  it('derives mean daily max/min from T2M_RANGE, not the monthly extremes', () => {
    const c = parseClimatology(json, 31.1, 30.9);
    expect(c.months[0].tmax).toBe(26);
    expect(c.months[0].tmin).toBe(14);
    expect(c.months[0].tmaxAbs).toBe(40);
    expect(c.elevationM).toBe(5);
    expect(etMethod(c)).toBe('penman_monteith');
  });
});

describe('MODIS NDVI', () => {
  const dates = { dates: Array.from({ length: 25 }, (_, i) => ({ modis_date: `A2024${String(1 + 16 * i).padStart(3, '0')}`, calendar_date: '' })) };
  it('splits the latest composites into windows of at most 10', () => {
    const w = requestWindows(dates, 25);
    expect(w).toHaveLength(3);
    expect(w[0][0]).toBe('A2024001');
  });
  it('drops fill values, scales, dedupes and finds bare months and cycles', () => {
    const sub = (d: string, v: number) => ({ modis_date: '', calendar_date: d, data: [v] });
    const pts = parseSubsets([{ subset: [sub('2024-01-01', 7000), sub('2024-03-01', 1500), sub('2024-03-01', 1500), sub('2024-06-01', 6000), sub('2024-08-01', -3000), sub('2024-09-01', 1800)] }]);
    expect(pts.map((p) => p.date)).toEqual(['2024-01-01', '2024-03-01', '2024-06-01', '2024-09-01']);
    const s = summarizeNdvi(pts, 31, 31);
    expect(s.monthly[0]).toBeCloseTo(0.7, 5);
    expect(s.bareMonths).toEqual([2, 8]);
    expect(s.monthly[2]! < BARE_NDVI).toBe(true);
    expect(s.cyclesPerYear).toBeGreaterThan(0);
  });
});
