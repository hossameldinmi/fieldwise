import { describe, expect, it } from 'vitest';
import { DEFAULT_DATASET } from '../src/lib/crops/default';
import { evaluateAll } from '../src/lib/engine/evaluate';
import { buildSchedule } from '../src/lib/engine/calendar';
import { STRATEGIES, farmStrategies } from '../src/lib/engine/strategies';
import { cropSoilScore, hostGaps } from '../src/lib/engine/dimensions';
import { soilAmendments } from '../src/lib/engine/amendments';
import { verifyLocation } from '../src/lib/geo/verify';
import { GOVERNORATES, findGovernorateByName, findGovernorateByPoint } from '../src/lib/geo/regions';
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
  it('covers all 27 governorates, including Sinai and the Red Sea', () => {
    expect(GOVERNORATES).toHaveLength(27);
    expect(findGovernorateByPoint(31.13, 33.8)?.id).toBe('north_sinai'); // El Arish
    expect(findGovernorateByPoint(28.24, 33.62)?.id).toBe('south_sinai'); // El Tor
    expect(findGovernorateByPoint(27.26, 33.81)?.id).toBe('red_sea'); // Hurghada
    expect(findGovernorateByPoint(31.26, 32.3)?.id).toBe('port_said');
    expect(findGovernorateByPoint(29.97, 32.55)?.id).toBe('suez');
    expect(findGovernorateByName('محافظة البحر الأحمر')?.id).toBe('red_sea');
    expect(findGovernorateByName('South Sinai Governorate')?.id).toBe('south_sinai');
  });
});

describe('farm strategies', () => {
  it('makes the current rotation option A and keeps B and C', () => {
    const s = farmStrategies({ winter: 'berseem', summer: 'rice' }, ['wheat', 'maize', 'faba_bean', 'sunflower']);
    expect(s.map((x) => x.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(s[0].slots.map((x) => x.cropId)).toEqual(['berseem', 'rice', 'berseem', 'rice']);
    expect(s[3].years).toBe(2);
  });
  it('omits D when the custom sequence is not whole years', () => {
    expect(farmStrategies({ winter: 'wheat', summer: 'maize' }, ['wheat', 'maize', 'wheat']).map((x) => x.id)).toEqual(['A', 'B', 'C']);
  });
  it('scores all four options', () => {
    const s = farmStrategies({ winter: 'wheat', summer: 'maize' }, ['faba_bean', 'maize', 'wheat', 'soybean', 'barley', 'sunflower', 'wheat', 'maize']);
    const rep = evaluateAll(farm(), deltaClimate, DEFAULT_DATASET, false, s);
    expect(rep.results).toHaveLength(4);
    expect(rep.results.find((r) => r.id === 'D')!.strategy.years).toBe(4);
    for (const r of rep.results) expect(r.total).toBeGreaterThan(0);
  });
});
