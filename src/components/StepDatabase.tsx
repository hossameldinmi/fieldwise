'use client';
import type { CropDataset, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { familyColor } from '@/lib/ui';
import { DatasetPanel } from './DatasetPanel';
import { PageHead } from './ui';

export function StepDatabase({ lang, dataset, onLoad }: { lang: Lang; dataset: CropDataset; onLoad: (d: CropDataset) => void }) {
  const cols = ['cCrop', 'cFam', 'cSeason', 'cDays', 'cTopt', 'cWater', 'cPh', 'cEce', 'cBnf', 'cRoot'];
  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's5eye')} title={t(lang, 's5title')} lead={t(lang, 's5lead')} aside={<DatasetPanel dataset={dataset} lang={lang} onLoad={onLoad} />} />
      <section className="fw-card mt-6" aria-label={t(lang, 's5title')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-field text-[13px] font-semibold text-sub">
                {cols.map((c) => <th key={c} scope="col" className="px-1 py-3 text-start">{t(lang, c)}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataset.crops.map((c) => (
                <tr key={c.id} className="border-b border-soft">
                  <th scope="row" className="px-1 py-[11px] text-start font-semibold">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: familyColor(c.family) }} />{c.name[lang]}</span>
                  </th>
                  <td className="px-1">{t(lang, c.family).replace(/\s*\(.*\)$/, '')}</td>
                  <td className="px-1">{t(lang, c.season)}</td>
                  <td className="px-1 font-mono">{c.durationDays}</td>
                  <td className="px-1 font-mono" dir="ltr">{c.tOptMin}–{c.tOptMax}</td>
                  <td className="px-1 font-mono">{c.waterRefMm}</td>
                  <td className="px-1 font-mono" dir="ltr">{c.ph.optMin}–{c.ph.optMax}</td>
                  <td className="px-1 font-mono">{c.salinity.threshold}</td>
                  <td className="px-1 font-mono" dir="ltr">{c.bnf ? `${c.bnf.netCredit.low}–${c.bnf.netCredit.high}` : '—'}</td>
                  <td className="px-1">{t(lang, c.root)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{t(lang, 'tier3')} · {t(lang, 'tier3d')}</p>
      </section>
    </main>
  );
}
