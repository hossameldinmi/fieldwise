import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { DEFAULT_DATASET } from '../src/lib/crops/default';
import { buildCropWorkbook, parseCropWorkbook } from '../src/lib/crops/xlsx';

describe('crop dataset', () => {
  it('reads the FAO-56 root/frost columns from the team sheet', () => {
    const wheat = DEFAULT_DATASET.crops.find((c) => c.id === 'wheat')!;
    expect(wheat.rootDepthM).toBe(1.5);
    expect(wheat.depletionP).toBe(0.55);
    expect(wheat.frostKillC).toBe(-5);
    expect(DEFAULT_DATASET.crops.find((c) => c.id === 'maize')!.frostKillC).toBe(0);
  });
  it('has bilingual disease entries for every team crop', () => {
    const ds = DEFAULT_DATASET.diseases ?? [];
    expect(ds).toHaveLength(49);
    for (const id of ['wheat', 'barley', 'faba_bean', 'maize', 'soybean', 'sunflower']) expect(ds.some((d) => d.cropId === id)).toBe(true);
    for (const d of ds) { expect(d.name.en).not.toMatch(/[؀-ۿ]/); expect(d.name.ar).toMatch(/[؀-ۿ]/); }
  });
  it('round-trips through crops_database.xlsx', () => {
    const buf = XLSX.write(buildCropWorkbook(DEFAULT_DATASET), { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const back = parseCropWorkbook(buf, DEFAULT_DATASET.version);
    expect(back.crops).toEqual(DEFAULT_DATASET.crops);
    expect(back.pathogens).toEqual(DEFAULT_DATASET.pathogens);
    expect(back.diseases).toEqual(DEFAULT_DATASET.diseases);
  });
  it('still accepts a workbook without a diseases sheet', () => {
    const wb = buildCropWorkbook(DEFAULT_DATASET);
    delete wb.Sheets.diseases; wb.SheetNames = wb.SheetNames.filter((n) => n !== 'diseases');
    const back = parseCropWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
    expect(back.diseases).toEqual([]);
  });
});
