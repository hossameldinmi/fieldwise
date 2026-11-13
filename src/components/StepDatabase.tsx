'use client';
import type { CropDataset, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { familyColor } from '@/lib/ui';
import { DatasetPanel } from './DatasetPanel';
import { PageHead } from './ui';

export function StepDatabase({ lang, dataset, onLoad }: { lang: Lang; dataset: CropDataset; onLoad: (d: CropDataset) => void }) {
  const cols = ['cCrop', 'cFam', 'cSeason', 'cDays', 'cTopt', 'cWater', 'cPh', 'cEce', 'cBnf', 'cRoot', 'cRootDepth', 'cDepletion', 'cFrost'];
  const opt = (v?: number) => (v === undefined ? '—' : v);
  const diseases = dataset.diseases ?? [];
  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's5eye')} title={t(lang, 's5title')} lead={t(lang, 's5lead')} aside={<DatasetPanel dataset={dataset} lang={lang} onLoad={onLoad} />} />
      <section className="fw-card mt-6" aria-label={t(lang, 's5title')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
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
                  <td className="px-1 font-mono">{opt(c.rootDepthM)}</td>
                  <td className="px-1 font-mono">{opt(c.depletionP)}</td>
                  <td className="px-1 font-mono" dir="ltr">{opt(c.frostKillC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">{t(lang, 'tier3')} · {t(lang, 'tier3d')}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(lang, 'newColsNote')}</p>
      </section>
      {diseases.length > 0 && (
        <section className="fw-card mt-6" aria-labelledby="diseases-h">
          <h2 id="diseases-h" className="fw-h2">{t(lang, 'diseasesTitle')}</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(lang, 'diseasesLead')} · {t(lang, 'tier3')}</p>
          <div className="mt-3 flex flex-col gap-2">
            {dataset.crops.filter((c) => diseases.some((d) => d.cropId === c.id)).map((c) => {
              const list = diseases.filter((d) => d.cropId === c.id);
              return (
                <details key={c.id} className="rounded-lg border border-line px-3 py-2">
                  <summary className="flex min-h-[44px] cursor-pointer items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: familyColor(c.family) }} />
                    {c.name[lang]} <span className="text-sm font-normal text-muted">· {t(lang, 'diseaseCount', { n: list.length })}</span>
                  </summary>
                  <div className="overflow-x-auto">
                    <table className="mt-2 w-full min-w-[640px] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-field text-[13px] font-semibold text-sub">
                          <th scope="col" className="w-[24%] px-1 py-2 text-start">{t(lang, 'diseaseCol')}</th>
                          <th scope="col" className="w-[26%] px-1 py-2 text-start">{t(lang, 'agentCol')}</th>
                          <th scope="col" className="px-1 py-2 text-start">{t(lang, 'conditionsCol')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((d, i) => (
                          <tr key={i} className="border-b border-soft align-top">
                            <th scope="row" className="px-1 py-2 text-start font-medium">{d.name[lang]}</th>
                            <td className="px-1 py-2 italic" dir="ltr" lang="la">{d.agent}</td>
                            <td className="px-1 py-2 leading-relaxed">{d.conditions[lang]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
