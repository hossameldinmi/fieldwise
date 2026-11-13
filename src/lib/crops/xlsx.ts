import * as XLSX from 'xlsx';
import type { CropDataset } from '../types';
import { CROP_COLUMNS, PATHOGEN_COLUMNS, cropToRow, pathogenToRow, rowToCrop, rowToPathogen, validateDataset } from './schema';

/** Parses crops_database.xlsx (sheets "crops" and "pathogens"). Works in browser and Node. */
export function parseCropWorkbook(data: ArrayBuffer, version = 'uploaded'): CropDataset {
  const wb = XLSX.read(data, { type: 'array' });
  const cropSheet = wb.Sheets['crops'];
  const pathSheet = wb.Sheets['pathogens'];
  if (!cropSheet || !pathSheet) throw new Error('Workbook must contain sheets named "crops" and "pathogens"');
  const crops = XLSX.utils.sheet_to_json<Record<string, unknown>>(cropSheet, { defval: '' }).map(rowToCrop);
  const pathogens = XLSX.utils.sheet_to_json<Record<string, unknown>>(pathSheet, { defval: '' }).map(rowToPathogen);
  return validateDataset({ version, crops, pathogens });
}

export function buildCropWorkbook(ds: CropDataset): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ds.crops.map(cropToRow), { header: [...CROP_COLUMNS] }), 'crops');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ds.pathogens.map(pathogenToRow), { header: [...PATHOGEN_COLUMNS] }), 'pathogens');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['version', ds.version], ['notes', ds.notes ?? '']]), 'about');
  return wb;
}
