/**
 * MODIS Terra MOD13Q1 (250 m, 16-day) NDVI at a point, from the ORNL DAAC MODIS Web Service
 * (https://modis.ornl.gov/data/modis_webservice.html). No Earthdata login is needed.
 */
export const MODIS_PRODUCT = 'MOD13Q1';
export const MODIS_BAND = '250m_16_days_NDVI';
const BASE = 'https://modis.ornl.gov/rst/api/v1';
/** The service returns at most 10 composites per subset request. */
export const MODIS_MAX_DATES = 10;
export const NDVI_SCALE = 0.0001;
const NDVI_FILL = -3000;
/** Composites ≈ 3 years at 23 per year. */
export const NDVI_COMPOSITES = 69;
/** Monthly mean NDVI below this is treated as bare soil or fallow (irrigated cropland peaks at 0.6–0.85). */
export const BARE_NDVI = 0.25;
/** A crop cycle is counted each time NDVI rises through this level. */
export const GREEN_NDVI = 0.45;

export interface NdviPoint { date: string; ndvi: number }
export interface NdviProfile {
  lat: number; lng: number;
  series: NdviPoint[];
  monthly: (number | null)[]; // Jan..Dec mean over the series
  bareMonths: number[];       // month indexes with mean NDVI < BARE_NDVI
  cyclesPerYear: number;
  latest: NdviPoint | null;
  period: string;
  source: string;
  resolution: string;
}

interface DatesResponse { dates?: { modis_date: string; calendar_date: string }[] }
interface SubsetResponse { subset?: { modis_date: string; calendar_date: string; data: number[] }[] }

const q = (lat: number, lng: number) => `latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}`;
export const datesUrl = (lat: number, lng: number) => `${BASE}/${MODIS_PRODUCT}/dates?${q(lat, lng)}`;
export const subsetUrl = (lat: number, lng: number, start: string, end: string) =>
  `${BASE}/${MODIS_PRODUCT}/subset?${q(lat, lng)}&band=${MODIS_BAND}&startDate=${start}&endDate=${end}&kmAboveBelow=0&kmLeftRight=0`;

/** Latest `count` composite dates, split into request windows of ≤ MODIS_MAX_DATES. */
export function requestWindows(dates: DatesResponse, count = NDVI_COMPOSITES): [string, string][] {
  const all = (dates.dates ?? []).map((d) => d.modis_date).slice(-count);
  const out: [string, string][] = [];
  for (let i = 0; i < all.length; i += MODIS_MAX_DATES) {
    const chunk = all.slice(i, i + MODIS_MAX_DATES);
    out.push([chunk[0], chunk[chunk.length - 1]]);
  }
  return out;
}

export function parseSubsets(parts: SubsetResponse[]): NdviPoint[] {
  const pts = parts.flatMap((p) => p.subset ?? [])
    .filter((s) => s.data?.length && s.data[0] !== NDVI_FILL)
    .map((s) => ({ date: s.calendar_date, ndvi: s.data[0] * NDVI_SCALE }));
  const seen = new Set<string>();
  return pts.filter((p) => !seen.has(p.date) && seen.add(p.date)).sort((a, b) => a.date.localeCompare(b.date));
}

/** Seasonal summary: monthly means, bare-soil months and crop cycles per year. */
export function summarizeNdvi(series: NdviPoint[], lat: number, lng: number): NdviProfile {
  const sums = Array(12).fill(0), counts = Array(12).fill(0);
  for (const p of series) { const m = Number(p.date.slice(5, 7)) - 1; sums[m] += p.ndvi; counts[m]++; }
  const monthly = sums.map((s, i) => (counts[i] ? s / counts[i] : null));
  const bareMonths = monthly.flatMap((v, i) => (v !== null && v < BARE_NDVI ? [i] : []));
  let rises = 0;
  for (let i = 1; i < series.length; i++) if (series[i - 1].ndvi < GREEN_NDVI && series[i].ndvi >= GREEN_NDVI) rises++;
  const years = series.length > 1
    ? (Date.parse(series[series.length - 1].date) - Date.parse(series[0].date)) / (365.25 * 86400000) : 0;
  return {
    lat, lng, series, monthly, bareMonths,
    cyclesPerYear: years > 0 ? rises / years : 0,
    latest: series[series.length - 1] ?? null,
    period: series.length ? `${series[0].date} – ${series[series.length - 1].date}` : '',
    source: 'NASA MODIS Terra MOD13Q1 v061 via ORNL DAAC MODIS Web Service',
    resolution: '250 m, 16-day composites',
  };
}
