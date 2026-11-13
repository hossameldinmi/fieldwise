import type { ClimateProfile, Crop, FarmInput, Level, Note, Pathogen } from '../types';
import { MONTH_DAYS, effectiveRain, monthOfDoy, monthlyPET } from '../nasa/climate';
import { agDayToDoy, MIN_PREP_DAYS, TARGET_PREP_DAYS, type Planting } from './calendar';
import type { Strategy } from './strategies';

export type DimensionId = 'thermal' | 'water' | 'soil' | 'nitrogen' | 'pest' | 'economic' | 'calendar' | 'resilience';
export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  thermal: 0.15, water: 0.15, soil: 0.15, nitrogen: 0.15, pest: 0.15, economic: 0.1, calendar: 0.1, resilience: 0.05,
};
export const DIMENSIONS = Object.keys(DIMENSION_WEIGHTS) as DimensionId[];

export interface DimensionResult { id: DimensionId; score: number; notes: Note[] }

export interface EvalContext {
  farm: FarmInput;
  climate: ClimateProfile;
  pathogens: Pathogen[];
  pet: number[];
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const r = (v: number, d = 0) => Number(v.toFixed(d));
export const seasonLabel = (p: Planting) => `${p.slot.year + 1}|${p.slot.season}`;

/* ---------- per-planting climate integration ---------- */

function kcAt(crop: Crop, f: number): number {
  const { ini, mid, end } = crop.kc;
  if (f < 0.2) return ini;
  if (f < 0.5) return ini + ((f - 0.2) / 0.3) * (mid - ini);
  if (f < 0.8) return mid;
  return mid + ((f - 0.8) / 0.2) * (end - mid);
}

export function cardinalFit(crop: Crop, t: number): number {
  if (t >= crop.tOptMin && t <= crop.tOptMax) return 100;
  if (t > crop.tBase && t < crop.tOptMin) return (100 * (t - crop.tBase)) / (crop.tOptMin - crop.tBase);
  if (t > crop.tOptMax && t < crop.tMax) return (100 * (crop.tMax - t)) / (crop.tMax - crop.tOptMax);
  return 0;
}

export interface SeasonStats { fit: number; gdd: number; tMinMonth: number; tMaxMonth: number; hotMonth: number | null; etcMm: number; peffMm: number }

export function seasonStats(p: Planting, ctx: EvalContext): SeasonStats {
  const { crop } = p;
  let fit = 0, gdd = 0, etc = 0, peff = 0;
  let tLo = Infinity, tHi = -Infinity, hot: number | null = null;
  for (let d = p.sow; d < p.harvest; d++) {
    const m = monthOfDoy(agDayToDoy(d));
    const c = ctx.climate.months[m];
    fit += cardinalFit(crop, c.t2m);
    gdd += Math.max(0, Math.min(c.t2m, crop.tMax) - crop.tBase);
    etc += kcAt(crop, (d - p.sow) / crop.durationDays) * ctx.pet[m];
    peff += effectiveRain(c.precMmDay * MONTH_DAYS[m]) / MONTH_DAYS[m];
    tLo = Math.min(tLo, c.t2m); tHi = Math.max(tHi, c.t2m);
    if (c.t2m > crop.tMax && hot === null) hot = m;
  }
  return { fit: fit / crop.durationDays, gdd, tMinMonth: tLo, tMaxMonth: tHi, hotMonth: hot, etcMm: etc, peffMm: peff };
}

/* ---------- 1. Climatic & thermal ---------- */
export function thermal(ps: Planting[], stats: SeasonStats[]): DimensionResult {
  const notes: Note[] = [];
  let acc = 0, w = 0;
  ps.forEach((p, i) => {
    const s = stats[i];
    const gddScore = clamp((100 * s.gdd) / p.crop.gddReq);
    const score = 0.7 * s.fit + 0.3 * gddScore;
    acc += score * p.crop.durationDays; w += p.crop.durationDays;
    notes.push({ key: 'thermal.crop', params: { crop: p.crop.id, season: seasonLabel(p), tmin: r(s.tMinMonth, 1), tmax: r(s.tMaxMonth, 1), fit: r(s.fit), gdd: r(s.gdd), req: p.crop.gddReq }, level: score < 60 ? 'warn' : 'info', tier: 2 });
    if (s.hotMonth !== null) notes.push({ key: 'thermal.heat', params: { crop: p.crop.id, month: s.hotMonth, max: p.crop.tMax }, level: 'risk', tier: 2 });
  });
  return { id: 'thermal', score: acc / w, notes };
}

/* ---------- 2. Water balance & irrigation ---------- */
export const IRRIGATION_EFFICIENCY = { drip: 0.875, sprinkler: 0.75, surface: 0.6, canal_flood: 0.55 } as const;
export const WATER_BUDGET_MM: Record<Level, number> = { high: 1800, medium: 1300, low: 900 };

export function water(ps: Planting[], stats: SeasonStats[], strategy: Strategy, farm: FarmInput): DimensionResult & { grossMmYr: number } {
  const eff = IRRIGATION_EFFICIENCY[farm.irrigation];
  const nir = stats.reduce((a, s) => a + Math.max(0, s.etcMm - s.peffMm), 0);
  const gross = nir / eff / strategy.years;
  const budget = WATER_BUDGET_MM[farm.water];
  const ratio = gross / budget;
  const score = clamp(100 - ((ratio - 0.7) / 0.6) * 100);
  const notes: Note[] = [
    { key: 'water.gross', params: { mm: r(gross), m3: r(gross * 10), eff: r(eff * 100), budget, security: farm.water }, level: ratio > 1 ? 'risk' : 'info', tier: 2 },
  ];
  ps.forEach((p, i) => notes.push({ key: 'water.crop', params: { crop: p.crop.id, season: seasonLabel(p), etc: r(stats[i].etcMm), ref: p.crop.waterRefMm }, level: 'info', tier: 2 }));
  return { id: 'water', score, notes, grossMmYr: gross };
}

/* ---------- 3. Soil texture, pH, salinity ---------- */
export const HEAVY_CLAY_PENALTY = 16;

export function phFit(crop: Crop, ph: number): number {
  const { min, optMin, optMax, max } = crop.ph;
  if (ph >= optMin && ph <= optMax) return 100;
  if (ph >= min && ph < optMin) return 60 + (40 * (ph - min)) / Math.max(0.01, optMin - min);
  if (ph > optMax && ph <= max) return 60 + (40 * (max - ph)) / Math.max(0.01, max - optMax);
  const dist = ph < min ? min - ph : ph - max;
  return clamp(60 - 80 * dist);
}

export function cropSoilScore(crop: Crop, farm: FarmInput) {
  const tex = crop.texture[farm.soil];
  const ph = phFit(crop, farm.ph);
  const sal = farm.ece === null ? 100 : clamp(100 - crop.salinity.slope * (farm.ece - crop.salinity.threshold));
  const clayPenalty = farm.soil === 'clay' && crop.tuberOrBulb ? HEAVY_CLAY_PENALTY : 0;
  return { tex, ph, sal, clayPenalty, score: clamp(0.5 * tex + 0.3 * ph + 0.2 * sal - clayPenalty) };
}

export function soil(ps: Planting[], farm: FarmInput): DimensionResult {
  const notes: Note[] = [];
  const scores = ps.map((p) => {
    const s = cropSoilScore(p.crop, farm);
    notes.push({ key: 'soil.crop', params: { crop: p.crop.id, season: seasonLabel(p), tex: r(s.tex), ph: r(s.ph), sal: r(s.sal) }, level: s.score < 60 ? 'warn' : 'info', tier: 2 });
    if (s.clayPenalty) notes.push({ key: 'soil.clayPenalty', params: { crop: p.crop.id }, level: 'risk', tier: 3 });
    return s.score;
  });
  if (ps.some((p) => p.crop.id === 'potato') && farm.ph > 6.5) notes.push({ key: 'soil.scab', params: { ph: farm.ph }, level: 'warn', tier: 3 });
  if (farm.ece === null) notes.push({ key: 'soil.ecMissing', level: 'warn', tier: 5 });
  return { id: 'soil', score: scores.reduce((a, b) => a + b, 0) / scores.length, notes };
}

/* ---------- 4. Biological N fixation ---------- */
export function nitrogen(ps: Planting[], strategy: Strategy): DimensionResult & { creditMid: number } {
  const notes: Note[] = [];
  let lo = 0, hi = 0;
  for (const p of ps) if (p.crop.bnf) { lo += p.crop.bnf.netCredit.low; hi += p.crop.bnf.netCredit.high; }
  lo /= strategy.years; hi /= strategy.years;
  const mid = (lo + hi) / 2;
  const legumeShare = ps.filter((p) => p.crop.bnf).length / ps.length;
  const cerealShare = ps.filter((p) => p.crop.family === 'Poaceae').length / ps.length;
  const monoPenalty = cerealShare >= 0.75 ? 25 : 0;
  if (mid > 0) notes.push({ key: 'bnf.credit', params: { low: r(lo, 1), high: r(hi, 1), mid: r(mid, 1) }, level: 'info', tier: 3 });
  else notes.push({ key: 'bnf.none', level: 'risk', tier: 3 });
  for (const p of ps) if (p.crop.bnf) notes.push({ key: 'bnf.crop', params: { crop: p.crop.id, tl: p.crop.bnf.totalFixed.low, th: p.crop.bnf.totalFixed.high, nl: p.crop.bnf.netCredit.low, nh: p.crop.bnf.netCredit.high, u: p.crop.bnf.uncertainty }, level: 'info', tier: 3 });
  if (monoPenalty) notes.push({ key: 'bnf.mono', params: { pct: r(cerealShare * 100) }, level: 'risk', tier: 3 });
  return { id: 'nitrogen', score: clamp(35 + 2.5 * mid + 15 * legumeShare - monoPenalty), notes, creditMid: mid };
}

/* ---------- 5. Pest & pathogen break ---------- */
/** Non-host seasons between successive host plantings in the repeating cycle. */
export function hostGaps(ps: Planting[], isHost: (p: Planting) => boolean) {
  const idx = ps.filter(isHost).map((p) => p.index);
  const n = ps.length;
  return idx.map((cur, j) => {
    const next = j + 1 < idx.length ? idx[j + 1] : idx[0] + n;
    return { from: ps[cur], to: ps[next % n], between: next - cur - 1 };
  });
}

export function pest(ps: Planting[], pathogens: Pathogen[]): DimensionResult {
  const notes: Note[] = [];
  let penalty = 0;
  for (const pg of pathogens) {
    if (!ps.some((p) => pg.hosts.includes(p.crop.id))) continue;
    const req = 2 * pg.breakYears;
    for (const g of hostGaps(ps, (p) => pg.hosts.includes(p.crop.id))) {
      const params = { pathogen: pg.id, gap: g.between, req, from: seasonLabel(g.from), to: seasonLabel(g.to) };
      if (g.between < req) {
        penalty += pg.severity * ((req - g.between) / req) * 40;
        notes.push({ key: 'pest.violation', params, level: 'risk', tier: 3 });
      } else notes.push({ key: 'pest.ok', params, level: 'info', tier: 3 });
    }
    if (pg.control === 'rotation_partial') notes.push({ key: 'pest.partial', params: { pathogen: pg.id }, level: 'info', tier: 3 });
  }
  const families = new Map<string, number>();
  for (const p of ps) if (p.crop.familyBreakYears > 0) families.set(p.crop.family, Math.max(families.get(p.crop.family) ?? 0, p.crop.familyBreakYears));
  families.forEach((years, family) => {
    const req = 2 * years;
    for (const g of hostGaps(ps, (p) => p.crop.family === family)) {
      const ok = g.between >= req;
      if (!ok) penalty += ((req - g.between) / req) * 30;
      notes.push({ key: ok ? 'pest.familyOk' : 'pest.family', params: { family, gap: g.between, req, from: seasonLabel(g.from), to: seasonLabel(g.to) }, level: ok ? 'info' : 'risk', tier: 3 });
    }
  });
  ps.forEach((p, i) => {
    const next = ps[(i + 1) % ps.length];
    if (ps.length > 1 && p.crop.family === next.crop.family) {
      penalty += 8;
      notes.push({ key: 'pest.backToBack', params: { family: p.crop.family, from: seasonLabel(p), to: seasonLabel(next) }, level: 'warn', tier: 3 });
    }
  });
  return { id: 'pest', score: clamp(100 - penalty), notes };
}

/* ---------- 6. Economic margin & capital risk ---------- */
export interface EconRaw { marginYr: number; riskYr: number; riskAdjYr: number; peakCost: number }
export const RISK_AVERSION = 0.5;
const CAPITAL_LIMIT: Record<Level, number> = { low: 2000, medium: 4000, high: Infinity };

export function economicRaw(ps: Planting[], strategy: Strategy): EconRaw {
  let margin = 0, varSum = 0, peak = 0;
  for (const { crop: { econ } } of ps) {
    const revenue = econ.yieldT * econ.priceUsdT;
    margin += revenue - econ.costUsd;
    varSum += (revenue * econ.priceCv) ** 2;
    peak = Math.max(peak, econ.costUsd);
  }
  const marginYr = margin / strategy.years;
  const riskYr = Math.sqrt(varSum) / strategy.years;
  return { marginYr, riskYr, riskAdjYr: marginYr - RISK_AVERSION * riskYr, peakCost: peak };
}

/** Scored relative to the best risk-adjusted margin among compared strategies. */
export function economic(raw: EconRaw, bestRiskAdj: number, farm: FarmInput, hectares: number): DimensionResult {
  const notes: Note[] = [
    { key: 'econ.margin', params: { margin: r(raw.marginYr), risk: r(raw.riskYr), farm: r(raw.marginYr * hectares) }, level: 'info', tier: 4 },
  ];
  let score = bestRiskAdj > 0 ? 40 + 60 * Math.max(0, raw.riskAdjYr) / bestRiskAdj : 50;
  if (raw.peakCost > CAPITAL_LIMIT[farm.capital]) {
    score -= farm.capital === 'low' ? 15 : 8;
    notes.push({ key: 'econ.capital', params: { cap: r(raw.peakCost), level: farm.capital }, level: 'warn', tier: 4 });
  }
  notes.push({ key: 'econ.placeholder', level: 'warn', tier: 4 });
  return { id: 'economic', score: clamp(score), notes };
}

/* ---------- 7. Calendar & turnaround ---------- */
export function calendar(ps: Planting[]): DimensionResult {
  const notes: Note[] = [];
  const transitions: number[] = ps.map((p, i): number => {
    const prev = ps[(i - 1 + ps.length) % ps.length];
    const g = p.gapBefore;
    const s = g >= TARGET_PREP_DAYS ? 100 : g >= MIN_PREP_DAYS ? 80 : g >= 0 ? 40 : 0;
    const params = { from: seasonLabel(prev), to: seasonLabel(p), days: g };
    notes.push({ key: g >= MIN_PREP_DAYS ? (i === 0 ? 'cal.wrap' : 'cal.gap') : 'cal.short', params, level: g >= MIN_PREP_DAYS ? 'info' : 'risk', tier: 4 });
    return s;
  });
  let late = 0;
  for (const p of ps) if (p.daysLate > 0) {
    late += Math.min(30, p.daysLate);
    notes.push({ key: 'cal.late', params: { crop: p.crop.id, season: seasonLabel(p), days: p.daysLate }, level: 'warn', tier: 4 });
  }
  return { id: 'calendar', score: clamp(transitions.reduce((a, b) => a + b, 0) / transitions.length - late), notes };
}

/* ---------- 8. Long-term resilience ---------- */
const deep = (p: Planting) => p.crop.root === 'taproot';
export function resilience(ps: Planting[]): DimensionResult {
  const alternations = ps.filter((p, i) => deep(p) !== deep(ps[(i + 1) % ps.length])).length / ps.length;
  const fams = [...new Set(ps.map((p) => p.crop.family))];
  const famScore = [0, 10, 40, 70, 85, 100][Math.min(5, fams.length)];
  return {
    id: 'resilience',
    score: clamp(50 * alternations + 0.5 * famScore),
    notes: [
      { key: 'res.roots', params: { pct: r(alternations * 100) }, level: alternations < 0.3 ? 'warn' : 'info', tier: 2 },
      { key: 'res.families', params: { n: fams.length, list: fams.join(', ') }, level: fams.length < 3 ? 'warn' : 'info', tier: 2 },
    ],
  };
}

export const weightedTotal = (dims: DimensionResult[]) =>
  dims.reduce((a, d) => a + d.score * DIMENSION_WEIGHTS[d.id], 0);

export { monthlyPET };
