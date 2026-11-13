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
}

export interface Pathogen {
  id: string;
  name: { en: string; ar: string };
  hosts: string[];
  breakYears: number;
  severity: number;
  control: 'rotation_effective' | 'rotation_partial';
}

export interface CropDataset { version: string; notes?: string; crops: Crop[]; pathogens: Pathogen[] }

export interface MonthClimate { t2m: number; tmax: number; tmin: number; precMmDay: number; rh: number; radMJ: number }

export interface ClimateProfile {
  lat: number; lng: number;
  months: MonthClimate[]; // Jan..Dec
  kind: 'climatology';
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
