import type { ClimateProfile, CropDataset, FarmInput, Note } from '../types';
import { toHectares } from '../units';
import { annualWaterBalance, monthlyPET } from '../nasa/climate';
import { buildSchedule, type Planting } from './calendar';
import { STRATEGIES, type Strategy, type StrategyId } from './strategies';
import * as D from './dimensions';
import { labDiagnostics, soilAmendments } from './amendments';

export interface StrategyResult {
  id: StrategyId;
  strategy: Strategy;
  plantings: Planting[];
  dims: D.DimensionResult[];
  total: number;
  metrics: { grossWaterMmYr: number; nCreditMid: number; marginYr: number; riskYr: number };
}

export interface Report {
  results: StrategyResult[];
  amendments: Note[];
  diagnostics: Note[];
  climate: { precipMm: number; petMm: number; deficitMm: number; deficitNote: Note };
  hectares: number;
}

export function evaluateAll(farm: FarmInput, climate: ClimateProfile, dataset: CropDataset, salinityZone = false, strategies = STRATEGIES): Report {
  const crops = new Map(dataset.crops.map((c) => [c.id, c]));
  const ctx: D.EvalContext = { farm, climate, pathogens: dataset.pathogens, pet: monthlyPET(climate) };
  const hectares = toHectares(farm.area, farm.areaUnit);

  const pre = strategies.map((s) => {
    const ps = buildSchedule(s, crops);
    const stats = ps.map((p) => D.seasonStats(p, ctx));
    return { s, ps, stats, econ: D.economicRaw(ps, s) };
  });
  const bestRA = Math.max(...pre.map((x) => x.econ.riskAdjYr));

  const results: StrategyResult[] = pre.map(({ s, ps, stats, econ }) => {
    const w = D.water(ps, stats, s, farm);
    const n = D.nitrogen(ps, s);
    const dims = [
      D.thermal(ps, stats), w, D.soil(ps, farm), n, D.pest(ps, dataset.pathogens),
      D.economic(econ, bestRA, farm, hectares), D.calendar(ps), D.resilience(ps),
    ];
    return {
      id: s.id, strategy: s, plantings: ps, dims, total: D.weightedTotal(dims),
      metrics: { grossWaterMmYr: w.grossMmYr, nCreditMid: n.creditMid, marginYr: econ.marginYr, riskYr: econ.riskYr },
    };
  });

  const allCrops = new Set(strategies.flatMap((s) => s.slots.map((x) => x.cropId)));
  const wb = annualWaterBalance(climate);
  return {
    results,
    amendments: soilAmendments(farm, allCrops.has('potato')),
    diagnostics: labDiagnostics(farm, allCrops, salinityZone),
    climate: {
      ...wb,
      deficitNote: { key: 'water.deficit', params: { deficit: Math.round(wb.deficitMm), p: Math.round(wb.precipMm), pet: Math.round(wb.petMm) }, level: 'info', tier: 2 },
    },
    hectares,
  };
}
