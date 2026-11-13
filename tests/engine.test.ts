import { describe, expect, it } from 'vitest';
import { DEFAULT_DATASET } from '../src/lib/crops/default';
import { evaluateAll } from '../src/lib/engine/evaluate';
import { buildSchedule } from '../src/lib/engine/calendar';
import { STRATEGIES } from '../src/lib/engine/strategies';
import { cropSoilScore, hostGaps } from '../src/lib/engine/dimensions';
import { soilAmendments } from '../src/lib/engine/amendments';
import { verifyLocation } from '../src/lib/geo/verify';
import { convertArea, toHectares } from '../src/lib/units';
import { deltaClimate, farm } from './fixtures';

const crops = new Map(DEFAULT_DATASET.crops.map((c) => [c.id, c]));
const byId = (id: string) => STRATEGIES.find((s) => s.id === id)!;

describe('units', () => {
  it('converts feddan/hectare/acre', () => {
    expect(toHectares(1, 'feddan')).toBeCloseTo(0.420083, 5);
    expect(convertArea(1, 'hectare', 'feddan')).toBeCloseTo(2.3805, 3);
    expect(convertArea(1, 'acre', 'feddan')).toBeCloseTo(0.9633, 3);
  });
});

describe('liming rule', () => {
  for (const ph of [6.0, 7.0, 7.9, 8.6]) {
    it(`never recommends lime at pH ${ph}`, () => {
      const keys = soilAmendments(farm({ ph }), true).map((n) => n.key);
      expect(keys).not.toContain('amend.lime');
      expect(keys).toContain('amend.noLime');
    });
  }
  it('allows lime only below pH 6.0', () => {
    expect(soilAmendments(farm({ ph: 5.4 }), false).map((n) => n.key)).toContain('amend.lime');
  });
  it('recommends gypsum for sodic soils', () => {
    expect(soilAmendments(farm({ sodic: true }), false).map((n) => n.key)).toContain('amend.gypsum');
  });
});

describe('heavy clay penalty', () => {
  it('applies −16 to tuber/bulb crops on clay only', () => {
    expect(cropSoilScore(crops.get('potato')!, farm({ soil: 'clay' })).clayPenalty).toBe(16);
    expect(cropSoilScore(crops.get('onion')!, farm({ soil: 'clay' })).clayPenalty).toBe(16);
    expect(cropSoilScore(crops.get('wheat')!, farm({ soil: 'clay' })).clayPenalty).toBe(0);
    expect(cropSoilScore(crops.get('potato')!, farm({ soil: 'sandy_loam' })).clayPenalty).toBe(0);
  });
});

describe('rotation logic', () => {
  it('Option C gives potato a 7-season non-Solanaceous break', () => {
    const ps = buildSchedule(byId('C'), crops);
    const gaps = hostGaps(ps, (p) => p.crop.family === 'Solanaceae');
    expect(gaps).toHaveLength(1);
    expect(gaps[0].between).toBe(7);
  });
  it('every turnaround is at least 14 days', () => {
    for (const s of STRATEGIES) for (const p of buildSchedule(s, crops)) expect(p.gapBefore).toBeGreaterThanOrEqual(14);
  });
  it('flags take-all in continuous wheat (Option A) but not Option B', () => {
    const rep = evaluateAll(farm(), deltaClimate, DEFAULT_DATASET);
    const pestNotes = (id: string) => rep.results.find((r) => r.id === id)!.dims.find((d) => d.id === 'pest')!.notes;
    expect(pestNotes('A').some((n) => n.key === 'pest.violation' && n.params?.pathogen === 'take_all')).toBe(true);
    expect(pestNotes('B').some((n) => n.key === 'pest.violation' && n.params?.pathogen === 'take_all')).toBe(false);
  });
  it('Option A has zero BNF credit; B has positive', () => {
    const rep = evaluateAll(farm(), deltaClimate, DEFAULT_DATASET);
    expect(rep.results[0].metrics.nCreditMid).toBe(0);
    expect(rep.results[1].metrics.nCreditMid).toBeGreaterThan(0);
  });
  it('weights sum to 100% and totals stay in range', () => {
    const rep = evaluateAll(farm(), deltaClimate, DEFAULT_DATASET);
    for (const r of rep.results) { expect(r.total).toBeGreaterThanOrEqual(0); expect(r.total).toBeLessThanOrEqual(100); }
  });
});

describe('geo verification', () => {
  it('overrides "Ismailia" with Kafr El Sheikh from GPS (offline bbox)', () => {
    const v = verifyLocation(farm({ governorate: 'Ismailia', lat: 31.3, lng: 30.9 }), null);
    expect(v.governorate?.id).toBe('kafr_el_sheikh');
    expect(v.overridden).toBe(true);
  });
  it('flags clay typed for a desert-reclamation zone', () => {
    const v = verifyLocation(farm({ governorate: 'Ismailia', lat: 30.6, lng: 32.1, soil: 'clay' }), null);
    expect(v.notes.map((n) => n.key)).toContain('geo.soilClayInSand');
  });
  it('uses reverse geocode state when present', () => {
    const v = verifyLocation(farm({ governorate: 'كفر الشيخ' }), { countryCode: 'eg', country: 'Egypt', state: 'Kafr El-Sheikh Governorate' });
    expect(v.method).toBe('reverse_geocode');
    expect(v.overridden).toBe(false);
  });
});
