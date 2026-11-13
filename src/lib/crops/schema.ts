import type { Crop, CropDataset, Pathogen, Texture } from '../types';
import { TEXTURES } from '../types';

/** Flat row layout used by crops_database.xlsx (one row per crop). */
export const CROP_COLUMNS = [
  'id', 'name_en', 'name_ar', 'family', 'season', 'sow_doy', 'sow_start_doy', 'sow_end_doy', 'duration_days', 'prep_weeks',
  't_base', 't_opt_min', 't_opt_max', 't_max', 'gdd_req', 'water_ref_mm', 'kc_ini', 'kc_mid', 'kc_end',
  ...TEXTURES.map((t) => `tex_${t}`),
  'ph_min', 'ph_opt_min', 'ph_opt_max', 'ph_max', 'ece_threshold', 'ece_slope',
  'bnf_total_low', 'bnf_total_high', 'bnf_net_low', 'bnf_net_high', 'bnf_uncertainty',
  'root', 'tuber_or_bulb', 'family_break_years',
  'yield_t_ha', 'price_usd_t', 'cost_usd_ha', 'price_cv', 'capital', 'sources',
] as const;

export const PATHOGEN_COLUMNS = ['id', 'name_en', 'name_ar', 'hosts', 'break_years', 'severity', 'control'] as const;

type Row = Record<string, unknown>;

export class DatasetError extends Error {}

function num(row: Row, key: string, opts: { min?: number; max?: number; optional?: boolean } = {}): number {
  const raw = row[key];
  if ((raw === undefined || raw === null || raw === '') && opts.optional) return NaN;
  const v = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(v)) throw new DatasetError(`${row.id ?? '?'}: "${key}" must be a number (got "${raw}")`);
  if (opts.min !== undefined && v < opts.min) throw new DatasetError(`${row.id}: "${key}" below ${opts.min}`);
  if (opts.max !== undefined && v > opts.max) throw new DatasetError(`${row.id}: "${key}" above ${opts.max}`);
  return v;
}
function str(row: Row, key: string, allowed?: readonly string[]): string {
  const v = String(row[key] ?? '').trim();
  if (!v) throw new DatasetError(`${row.id ?? '?'}: "${key}" is required`);
  if (allowed && !allowed.includes(v)) throw new DatasetError(`${row.id}: "${key}" must be one of ${allowed.join(', ')}`);
  return v;
}

export function rowToCrop(row: Row): Crop {
  const texture = Object.fromEntries(TEXTURES.map((t) => [t, num(row, `tex_${t}`, { min: 0, max: 100 })])) as Record<Texture, number>;
  const bnfTotalLow = num(row, 'bnf_total_low', { optional: true, min: 0 });
  const crop: Crop = {
    id: str(row, 'id'),
    name: { en: str(row, 'name_en'), ar: str(row, 'name_ar') },
    family: str(row, 'family'),
    season: str(row, 'season', ['winter', 'summer', 'nili']) as Crop['season'],
    sowDoy: num(row, 'sow_doy', { min: 1, max: 365 }),
    sowWindow: [num(row, 'sow_start_doy', { min: 1, max: 365 }), num(row, 'sow_end_doy', { min: 1, max: 365 })],
    durationDays: num(row, 'duration_days', { min: 30, max: 330 }),
    prepWeeks: num(row, 'prep_weeks', { min: 0, max: 8 }),
    tBase: num(row, 't_base'), tOptMin: num(row, 't_opt_min'), tOptMax: num(row, 't_opt_max'), tMax: num(row, 't_max'),
    gddReq: num(row, 'gdd_req', { min: 0 }),
    waterRefMm: num(row, 'water_ref_mm', { min: 0 }),
    kc: { ini: num(row, 'kc_ini', { min: 0, max: 1.5 }), mid: num(row, 'kc_mid', { min: 0, max: 1.5 }), end: num(row, 'kc_end', { min: 0, max: 1.5 }) },
    texture,
    ph: { min: num(row, 'ph_min'), optMin: num(row, 'ph_opt_min'), optMax: num(row, 'ph_opt_max'), max: num(row, 'ph_max') },
    salinity: { threshold: num(row, 'ece_threshold', { min: 0 }), slope: num(row, 'ece_slope', { min: 0 }) },
    bnf: Number.isFinite(bnfTotalLow)
      ? {
          totalFixed: { low: bnfTotalLow, high: num(row, 'bnf_total_high') },
          netCredit: { low: num(row, 'bnf_net_low'), high: num(row, 'bnf_net_high') },
          uncertainty: str(row, 'bnf_uncertainty', ['low', 'medium', 'high']) as 'low' | 'medium' | 'high',
        }
      : null,
    root: str(row, 'root', ['fibrous', 'taproot', 'tuber_bulb']) as Crop['root'],
    tuberOrBulb: ['true', '1', 'yes'].includes(String(row.tuber_or_bulb).toLowerCase()),
    familyBreakYears: num(row, 'family_break_years', { min: 0, max: 10 }),
    econ: {
      yieldT: num(row, 'yield_t_ha', { min: 0 }), priceUsdT: num(row, 'price_usd_t', { min: 0 }),
      costUsd: num(row, 'cost_usd_ha', { min: 0 }), priceCv: num(row, 'price_cv', { min: 0, max: 2 }),
      capital: str(row, 'capital', ['low', 'medium', 'high']) as 'low' | 'medium' | 'high',
    },
    sources: String(row.sources ?? '').split(';').map((s) => s.trim()).filter(Boolean),
  };
  const { tBase, tOptMin, tOptMax, tMax } = crop;
  if (!(tBase < tOptMin && tOptMin <= tOptMax && tOptMax < tMax)) throw new DatasetError(`${crop.id}: cardinal temperatures must satisfy base < optMin ≤ optMax < max`);
  const p = crop.ph;
  if (!(p.min <= p.optMin && p.optMin <= p.optMax && p.optMax <= p.max)) throw new DatasetError(`${crop.id}: pH range out of order`);
  return crop;
}

export function cropToRow(c: Crop): Row {
  return {
    id: c.id, name_en: c.name.en, name_ar: c.name.ar, family: c.family, season: c.season,
    sow_doy: c.sowDoy, sow_start_doy: c.sowWindow[0], sow_end_doy: c.sowWindow[1], duration_days: c.durationDays, prep_weeks: c.prepWeeks,
    t_base: c.tBase, t_opt_min: c.tOptMin, t_opt_max: c.tOptMax, t_max: c.tMax, gdd_req: c.gddReq, water_ref_mm: c.waterRefMm,
    kc_ini: c.kc.ini, kc_mid: c.kc.mid, kc_end: c.kc.end,
    ...Object.fromEntries(TEXTURES.map((t) => [`tex_${t}`, c.texture[t]])),
    ph_min: c.ph.min, ph_opt_min: c.ph.optMin, ph_opt_max: c.ph.optMax, ph_max: c.ph.max,
    ece_threshold: c.salinity.threshold, ece_slope: c.salinity.slope,
    bnf_total_low: c.bnf?.totalFixed.low ?? '', bnf_total_high: c.bnf?.totalFixed.high ?? '',
    bnf_net_low: c.bnf?.netCredit.low ?? '', bnf_net_high: c.bnf?.netCredit.high ?? '', bnf_uncertainty: c.bnf?.uncertainty ?? '',
    root: c.root, tuber_or_bulb: c.tuberOrBulb, family_break_years: c.familyBreakYears,
    yield_t_ha: c.econ.yieldT, price_usd_t: c.econ.priceUsdT, cost_usd_ha: c.econ.costUsd, price_cv: c.econ.priceCv, capital: c.econ.capital,
    sources: c.sources.join('; '),
  };
}

export function rowToPathogen(row: Row): Pathogen {
  return {
    id: str(row, 'id'),
    name: { en: str(row, 'name_en'), ar: str(row, 'name_ar') },
    hosts: str(row, 'hosts').split(/[;,]/).map((s) => s.trim()).filter(Boolean),
    breakYears: num(row, 'break_years', { min: 0, max: 15 }),
    severity: num(row, 'severity', { min: 0, max: 1 }),
    control: str(row, 'control', ['rotation_effective', 'rotation_partial']) as Pathogen['control'],
  };
}

export const pathogenToRow = (p: Pathogen): Row => ({
  id: p.id, name_en: p.name.en, name_ar: p.name.ar, hosts: p.hosts.join('; '),
  break_years: p.breakYears, severity: p.severity, control: p.control,
});

/** Validates cross-references (pathogen hosts must exist, ids unique). */
export function validateDataset(ds: CropDataset): CropDataset {
  const ids = new Set<string>();
  for (const c of ds.crops) {
    if (ids.has(c.id)) throw new DatasetError(`Duplicate crop id "${c.id}"`);
    ids.add(c.id);
  }
  for (const p of ds.pathogens)
    for (const h of p.hosts) if (!ids.has(h)) throw new DatasetError(`Pathogen "${p.id}" lists unknown host "${h}"`);
  return ds;
}
