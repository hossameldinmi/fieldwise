'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { CropDataset, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { buildCropWorkbook, parseCropWorkbook } from '@/lib/crops/xlsx';

export function DatasetPanel({ dataset, lang, onLoad }: { dataset: CropDataset; lang: Lang; onLoad: (d: CropDataset) => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="max-w-[420px] space-y-2 text-end text-sm">
      <div className="flex flex-wrap justify-end gap-2">
        <label className="fw-btn cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M4 21h16" /></svg>
          {t(lang, 'datasetLoad')}
          <input type="file" accept=".xlsx" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { setError(null); onLoad(parseCropWorkbook(await file.arrayBuffer(), file.name)); }
            catch (err) { setError(err instanceof Error ? err.message : String(err)); }
          }} />
        </label>
        <button type="button" className="fw-btn" onClick={() => XLSX.writeFile(buildCropWorkbook(dataset), 'crops_database.xlsx')}>
          {t(lang, 'datasetDownload')}
        </button>
      </div>
      <p className="text-xs text-muted">{t(lang, 'datasetLoaded', { n: dataset.crops.length, p: dataset.pathogens.length, v: dataset.version })}</p>
      {error && <p role="alert" className="text-red">{error}</p>}
    </div>
  );
}
