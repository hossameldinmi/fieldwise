import type { ClimateProfile, MonthClimate } from '../types';

/**
 * Climatology parameters requested from NASA POWER (community=AG).
 * Note: in the climatology endpoint T2M_MAX / T2M_MIN are the month's EXTREMES, so mean daily max/min
 * are derived from T2M ± T2M_RANGE / 2 instead.
 */
export const POWER_PARAMS = [
  'T2M', 'T2M_RANGE', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'ALLSKY_SFC_SW_DWN',
  'WS2M', 'T2MDEW', 'GWETROOT', 'GWETTOP', 'FROST_DAYS',
] as const;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const POWER_FILL = -999;

export const CLIMATOLOGY_PERIOD = { start: 2001, end: 2020 };

export function climatologyUrl(lat: number, lng: number) {
  const q = new URLSearchParams({
    parameters: POWER_PARAMS.join(','), community: 'AG',
    latitude: lat.toFixed(4), longitude: lng.toFixed(4), format: 'JSON',
    start: String(CLIMATOLOGY_PERIOD.start), end: String(CLIMATOLOGY_PERIOD.end),
  });
  return `https://power.larc.nasa.gov/api/temporal/climatology/point?${q}`;
}

interface PowerResponse {
  geometry?: { coordinates?: number[] };
  properties?: { parameter?: Record<string, Record<string, number>> };
  parameters?: Record<string, { units?: string }>;
  messages?: string[];
}

/** Converts a NASA POWER climatology response into a monthly profile. Throws on missing/fill values of required parameters. */
export function parseClimatology(json: PowerResponse, lat: number, lng: number): ClimateProfile {
  const p = json.properties?.parameter;
  if (!p) throw new Error(`NASA POWER returned no parameter block${json.messages?.length ? `: ${json.messages.join(' ')}` : ''}`);
  const radUnits = json.parameters?.ALLSKY_SFC_SW_DWN?.units ?? 'MJ/m^2/day';
  const radFactor = /kw-?hr|kwh/i.test(radUnits) ? 3.6 : 1; // kWh -> MJ
  const months: MonthClimate[] = MONTHS.map((m) => {
    const opt = (k: string) => {
      const v = p[k]?.[m];
      return v === undefined || v === POWER_FILL || !Number.isFinite(v) ? undefined : v;
    };
    const get = (k: string) => {
      const v = opt(k);
      if (v === undefined) throw new Error(`NASA POWER: ${k} missing for ${m}`);
      return v;
    };
    const t2m = get('T2M');
    const tmaxAbs = get('T2M_MAX'), tminAbs = get('T2M_MIN');
    const range = opt('T2M_RANGE');
    return {
      t2m,
      tmax: range === undefined ? tmaxAbs : t2m + range / 2,
      tmin: range === undefined ? tminAbs : t2m - range / 2,
      tmaxAbs, tminAbs,
      precMmDay: get('PRECTOTCORR'), rh: get('RH2M'), radMJ: get('ALLSKY_SFC_SW_DWN') * radFactor,
      ws2m: opt('WS2M'), dewC: opt('T2MDEW'), gwetRoot: opt('GWETROOT'), gwetTop: opt('GWETTOP'), frostDays: opt('FROST_DAYS'),
    };
  });
  const z = json.geometry?.coordinates?.[2];
  return {
    lat, lng, months, kind: 'climatology',
    elevationM: Number.isFinite(z) ? z : undefined,
    period: `${CLIMATOLOGY_PERIOD.start}–${CLIMATOLOGY_PERIOD.end}`,
    resolution: 'MERRA-2 meteorology 0.5° × 0.625°; CERES solar 1° × 1°',
    source: 'NASA POWER (power.larc.nasa.gov), community=AG',
  };
}
