'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { CropDataset, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { buildCropWorkbook, parseCropWorkbook } from '@/lib/crops/xlsx';

export function DatasetPanel({ dataset, lang, onLoad }: { dataset: CropDataset; lang: Lang; onLoad: (d: CropDataset) => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium text-siltSoft">{t(lang, 'dataset')}</p>
      <p className="text-siltSoft">{t(lang, 'datasetLoaded', { n: dataset.crops.length, p: dataset.pathogens.length, v: dataset.version })}</p>
      <div className="flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-md border border-line bg-white px-3 py-1.5 hover:border-berseem focus-within:ring-2 focus-within:ring-berseem">
          {t(lang, 'datasetLoad')}
          <input type="file" accept=".xlsx" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try { setError(null); onLoad(parseCropWorkbook(await file.arrayBuffer(), file.name)); }
            catch (err) { setError(err instanceof Error ? err.message : String(err)); }
          }} />
        </label>
        <button type="button" className="rounded-md border border-line bg-white px-3 py-1.5 hover:border-berseem focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berseem"
          onClick={() => XLSX.writeFile(buildCropWorkbook(dataset), 'crops_database.xlsx')}>
          {t(lang, 'datasetDownload')}
        </button>
      </div>
      {error && <p role="alert" className="text-blight">{error}</p>}
    </div>
  );
}
