export type Lang = 'en' | 'ar';
export type Texture = 'sand' | 'loamy_sand' | 'sandy_loam' | 'loam' | 'clay_loam' | 'clay';
export const TEXTURES: Texture[] = ['sand', 'loamy_sand', 'sandy_loam', 'loam', 'clay_loam', 'clay'];
export type Season = 'winter' | 'summer' | 'nili';
export type Irrigation = 'drip' | 'sprinkler' | 'surface' | 'canal_flood';
export type Level = 'low' | 'medium' | 'high';
export type RootType = 'fibrous' | 'taproot' | 'tuber_bulb';
export type AreaUnit = 'feddan' | 'hectare' | 'acre';

/** Five data-provenance tiers shown on every figure in the report. */
export type Tier = 1 | 2 | 3 | 4 | 5;

export interface Range { low: number; high: number }

export interface Crop {
  id: string;
  name: { en: string; ar: string };
  family: string;
  season: Season;
  sowDoy: number;
  sowWindow: [number, number];
  durationDays: number;
  prepWeeks: number;
  tBase: number; tOptMin: number; tOptMax: number; tMax: number;
  gddReq: number;
  waterRefMm: number;
  kc: { ini: number; mid: number; end: number };
  texture: Record<Texture, number>;
  ph: { min: number; optMin: number; optMax: number; max: number };
  salinity: { threshold: number; slope: number };
  bnf: { totalFixed: Range; netCredit: Range; uncertainty: Level } | null;
  root: RootType;
  tuberOrBulb: boolean;
  familyBreakYears: number;
  econ: { yieldT: number; priceUsdT: number; costUsd: number; priceCv: number; capital: Level };
  sources: string[];
  /** FAO-56 Table 22 max effective rooting depth (m). Not scored yet (planned: SMAP root-zone moisture). */
  rootDepthM?: number;
  /** FAO-56 Table 22 depletion fraction p before water stress (0–1). Not scored yet. */
  depletionP?: number;
  /** Daily minimum air temperature (°C) that kills the crop at its most sensitive stage. Not scored yet. */
  frostKillC?: number;
  /** FAO GAEZ v4 crop code, for a planned suitability cross-check. */
  gaezCode?: string;
}

export interface Pathogen {
  id: string;
  name: { en: string; ar: string };
  hosts: string[];
  breakYears: number;
  severity: number;
  control: 'rotation_effective' | 'rotation_partial';
}

/**
 * A disease of one crop and the conditions that favour it. Reference information only: most of these
 * are airborne or seed-borne, so rotation does not control them and they are not scored.
 */
export interface Disease {
  cropId: string;
  name: { en: string; ar: string };
  agent: string;
  conditions: { en: string; ar: string };
}

export interface CropDataset { version: string; notes?: string; crops: Crop[]; pathogens: Pathogen[]; diseases?: Disease[] }

/**
 * One month of climatology. `tmax`/`tmin` are MEAN daily max/min (t2m ± half the mean daily range),
 * not the month's extremes, which are kept separately in `tmaxAbs`/`tminAbs`.
 * Optional fields come from extra NASA POWER parameters and enable Penman-Monteith ET₀ and frost/soil-moisture notes.
 */
export interface MonthClimate {
  t2m: number; tmax: number; tmin: number; precMmDay: number; rh: number; radMJ: number;
  tmaxAbs?: number; tminAbs?: number;
  ws2m?: number;      // wind speed at 2 m (m/s)
  dewC?: number;      // dew/frost point at 2 m (°C)
  gwetRoot?: number;  // root-zone soil wetness (0–1)
  gwetTop?: number;   // surface soil wetness (0–1)
  frostDays?: number; // days in the month with T2M_MIN < 0 °C
}

export interface ClimateProfile {
  lat: number; lng: number;
  months: MonthClimate[]; // Jan..Dec
  kind: 'climatology';
  elevationM?: number; // grid-cell elevation reported by POWER (used for air pressure in ET₀)
  period: string;
  resolution: string;
  source: string;
}

export interface FarmInput {
  name: string;
  lat: number; lng: number;
  area: number; areaUnit: AreaUnit;
  governorate: string; country: string;
  soil: Texture;
  ph: number;
  organicMatter: number;
  ece: number | null;
  sodic: boolean;
  irrigation: Irrigation;
  water: Level;
  capital: Level;
}

/** Message emitted by the engine; rendered via i18n so reports stay bilingual. */
export interface Note {
  key: string;
  params?: Record<string, string | number>;
  level: 'info' | 'warn' | 'risk';
  tier: Tier;
}
