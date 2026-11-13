/**
 * crops_database.xlsx <-> data/crops.json
 *   npm run crops:export   writes crops_database.xlsx from data/crops.json
 *   npm run crops:import   validates crops_database.xlsx and rewrites data/crops.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { buildCropWorkbook, parseCropWorkbook } from '../src/lib/crops/xlsx';
import type { CropDataset } from '../src/lib/types';

const JSON_PATH = 'data/crops.json';
const XLSX_PATH = process.argv[3] ?? 'crops_database.xlsx';
const cmd = process.argv[2];

if (cmd === 'export') {
  const ds = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as CropDataset;
  writeFileSync(XLSX_PATH, XLSX.write(buildCropWorkbook(ds), { type: 'buffer', bookType: 'xlsx' }));
  console.log(`Wrote ${XLSX_PATH} (${ds.crops.length} crops, ${ds.pathogens.length} pathogens)`);
} else if (cmd === 'import') {
  const buf = readFileSync(XLSX_PATH);
  const prev = JSON.parse(readFileSync(JSON_PATH, 'utf8')) as CropDataset;
  const ds = parseCropWorkbook(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), prev.version);
  writeFileSync(JSON_PATH, JSON.stringify({ ...ds, notes: prev.notes }, null, 2) + '\n');
  console.log(`Validated and imported ${ds.crops.length} crops into ${JSON_PATH}`);
} else {
  console.error('Usage: tsx scripts/crops.ts <export|import> [file.xlsx]');
  process.exit(1);
}
