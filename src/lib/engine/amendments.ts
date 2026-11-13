import type { FarmInput, Note } from '../types';

export const ACID_PH_LIMIT = 6.0;

/**
 * Soil amendment rules. Lime is recommended ONLY when pH is verified acidic (< 6.0).
 * Neutral/alkaline soils get gypsum (if sodic), elemental sulfur, or acidifying fertilizers.
 */
export function soilAmendments(farm: FarmInput, rotationHasPotato: boolean): Note[] {
  const notes: Note[] = [];
  const ph = farm.ph;
  if (ph < ACID_PH_LIMIT) {
    notes.push({ key: 'amend.lime', params: { ph }, level: 'info', tier: 5 });
  } else {
    notes.push({ key: 'amend.noLime', params: { ph }, level: 'info', tier: 3 });
    if (farm.sodic || ph >= 8.5) notes.push({ key: 'amend.gypsum', level: 'warn', tier: 3 });
    if (ph > 7.3 || rotationHasPotato) notes.push({ key: 'amend.sulfur', level: 'info', tier: 3 });
  }
  if (farm.organicMatter < 1.5) notes.push({ key: 'amend.om', params: { om: farm.organicMatter }, level: 'info', tier: 3 });
  return notes;
}

export function labDiagnostics(farm: FarmInput, cropIds: Set<string>, salinityZone: boolean): Note[] {
  const n: Note[] = [];
  const add = (key: string) => n.push({ key, level: 'info', tier: 5 });
  if (farm.ece === null || salinityZone) add('diag.ece');
  add('diag.olsenP');
  if (farm.sodic || farm.ph > 8.2 || salinityZone) add('diag.esp');
  if (farm.ph > 7.5) add('diag.caco3');
  if (cropIds.has('soybean') || cropIds.has('faba_bean') || cropIds.has('berseem')) add('diag.rhizobia');
  if (cropIds.has('potato')) add('diag.pcn');
  if (cropIds.has('faba_bean')) add('diag.orobanche');
  return n;
}
