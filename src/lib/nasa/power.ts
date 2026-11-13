import type { ClimateProfile, MonthClimate } from '../types';

export const POWER_PARAMS = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'ALLSKY_SFC_SW_DWN'] as const;
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
  properties?: { parameter?: Record<string, Record<string, number>> };
  parameters?: Record<string, { units?: string }>;
  messages?: string[];
}

/** Converts a NASA POWER climatology response into a monthly profile. Throws on missing/fill values. */
export function parseClimatology(json: PowerResponse, lat: number, lng: number): ClimateProfile {
  const p = json.properties?.parameter;
  if (!p) throw new Error(`NASA POWER returned no parameter block${json.messages?.length ? `: ${json.messages.join(' ')}` : ''}`);
  const radUnits = json.parameters?.ALLSKY_SFC_SW_DWN?.units ?? 'MJ/m^2/day';
  const radFactor = /kw-?hr|kwh/i.test(radUnits) ? 3.6 : 1; // kWh -> MJ
  const months: MonthClimate[] = MONTHS.map((m) => {
    const get = (k: string) => {
      const v = p[k]?.[m];
      if (v === undefined || v === POWER_FILL || !Number.isFinite(v)) throw new Error(`NASA POWER: ${k} missing for ${m}`);
      return v;
    };
    return {
      t2m: get('T2M'), tmax: get('T2M_MAX'), tmin: get('T2M_MIN'),
      precMmDay: get('PRECTOTCORR'), rh: get('RH2M'), radMJ: get('ALLSKY_SFC_SW_DWN') * radFactor,
    };
  });
  return {
    lat, lng, months, kind: 'climatology',
    period: `${CLIMATOLOGY_PERIOD.start}–${CLIMATOLOGY_PERIOD.end}`,
    resolution: 'MERRA-2 meteorology 0.5° × 0.625°; CERES solar 1° × 1°',
    source: 'NASA POWER (power.larc.nasa.gov), community=AG',
  };
}
