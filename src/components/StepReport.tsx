'use client';
import type { CropDataset, FarmInput, Lang, Note } from '@/lib/types';
import type { Report } from '@/lib/engine/evaluate';
import type { Planting } from '@/lib/engine/calendar';
import { agDayToDoy } from '@/lib/engine/calendar';
import { DIMENSIONS } from '@/lib/engine/dimensions';
import { doyToDate } from '@/lib/nasa/climate';
import { monthName, renderNote, t } from '@/lib/i18n';
import { governorateLabel } from '@/lib/geo/regions';
import { familyColor, statusOf } from '@/lib/ui';
import { GapsBox, PageHead, RuleItem, TierLegend } from './ui';
import type { NdviProfile } from '@/lib/nasa/modis';

const LEVEL_ORDER: Record<Note['level'], number> = { risk: 0, warn: 1, info: 2 };
const MAX_FINDINGS = 8;

interface Props { lang: Lang; report: Report; dataset: CropDataset; farm: FarmInput; ndvi: NdviProfile | null; onBack: () => void; onRestart: () => void }

export function StepReport({ lang, report, dataset, farm, ndvi, onBack, onRestart }: Props) {
  const ranked = [...report.results].sort((a, b) => b.total - a.total);
  const best = ranked[0];
  const date = (agDay: number) => { const { month, day } = doyToDate(agDayToDoy(agDay)); return `${day} ${monthName(lang, month)}`; };
  const cell = (p?: Planting) => p && (
    <div className="rounded-lg px-3 py-2.5" style={{ background: familyColor(p.crop.family) }}>
      <b>{p.crop.name[lang]}</b>
      <div className="text-xs text-sub">{date(p.sow)} – {date(p.harvest)}</div>
    </div>
  );

  const legumes = best.plantings.filter((p) => p.crop.bnf);
  const nPerSeason = legumes.length
    ? (legumes.reduce((a, p) => a + (p.crop.bnf!.netCredit.low + p.crop.bnf!.netCredit.high) / 2, 0) / legumes.length) * report.hectares
    : 0;
  const families = new Set(best.plantings.map((p) => p.crop.family)).size;
  const watch = [...new Map(best.plantings.map((p) => [p.crop.id, p.crop])).values()]
    .map((crop) => ({ crop, names: [...new Set((dataset.diseases ?? []).filter((d) => d.cropId === crop.id).map((d) => d.name[lang]))] }))
    .filter((w) => w.names.length > 0);
  const findings = best.dims
    .flatMap((d) => d.notes.map((n) => ({ n, dim: d.id })))
    .sort((a, b) => LEVEL_ORDER[a.n.level] - LEVEL_ORDER[b.n.level])
    .slice(0, MAX_FINDINGS);
  const chips = [
    `${farm.governorate ? governorateLabel(farm.governorate, lang) : farm.country} · ${farm.lat.toFixed(4)}, ${farm.lng.toFixed(4)}`,
    t(lang, 'chipArea', { a: farm.area, u: t(lang, farm.areaUnit), ha: report.hectares.toFixed(2) }),
    t(lang, 'chipSoil', { soil: t(lang, farm.soil), ph: farm.ph, om: farm.organicMatter }) + (farm.ece === null ? '' : t(lang, 'chipEce', { ece: farm.ece })),
    t(lang, farm.irrigation),
  ];

  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's4eye')} title={`${t(lang, 's4title')} — ${farm.name}`}
        aside={
          <button type="button" className="fw-btn no-print" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>
            {t(lang, 'print')}
          </button>
        } />
      <div className="mt-3.5 flex flex-wrap gap-2">{chips.map((c) => <span key={c} className="fw-chip text-[13px]">{c}</span>)}</div>

      <div className="mt-6 flex flex-wrap gap-6">
        <section className="fw-card min-w-0 flex-[1_1_560px] border-2 border-green" aria-label={t(lang, 'recommended')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-green px-2.5 py-[3px] text-xs font-semibold text-white">{t(lang, 'recommended')}</span>
              <h2 className="mt-2.5 text-[22px] font-bold leading-snug">{t(lang, 'optionWord')} {best.id} · {t(lang, `strategy${best.id}`)}</h2>
            </div>
            <div className="text-center"><div dir="ltr" className="text-[40px] font-bold leading-none">{Math.round(best.total)}</div><div className="mt-1 text-xs text-muted">{t(lang, 'of100')}</div></div>
          </div>
          <div className="mt-[18px] grid grid-cols-[72px_repeat(2,minmax(0,1fr))] gap-2 text-[13px] font-semibold">
            <div /><div className="text-blue">{t(lang, 'winterSeason')}</div><div className="text-amber">{t(lang, 'summerSeason')}</div>
          </div>
          {Array.from({ length: best.strategy.years }, (_, y) => (
            <div key={y} className="mt-2 grid grid-cols-[72px_repeat(2,minmax(0,1fr))] gap-2">
              <div className="flex items-center text-sm font-semibold">{t(lang, 'yearN', { n: y + 1 })}</div>
              {cell(best.plantings.find((p) => p.slot.year === y && p.slot.season === 'winter'))}
              {cell(best.plantings.find((p) => p.slot.year === y && p.slot.season === 'summer'))}
            </div>
          ))}
          <div className="mt-[18px] grid grid-cols-3 gap-3 border-t border-soft pt-4">
            <Metric label={t(lang, 'farmWater')} value={Math.round(best.metrics.grossWaterMmYr * 10 * report.hectares).toLocaleString('en-US')} unit={t(lang, 'm3yr')} />
            <Metric label={t(lang, 'farmN')} value={Math.round(nPerSeason).toLocaleString('en-US')} unit={t(lang, 'kgN')} />
            <Metric label={t(lang, 'families')} value={String(families)} />
          </div>
        </section>

        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <section className="fw-card" aria-label={t(lang, 'actions')}>
            <h2 className="fw-h2">{t(lang, 'actions')}</h2>
            <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-sm leading-relaxed">
              {report.amendments.map((n, i) => <li key={i}>{renderNote(n, lang, dataset)}</li>)}
            </ol>
          </section>
          {watch.length > 0 && (
            <section className="fw-card" aria-label={t(lang, 'watchTitle')}>
              <h2 className="fw-h2">{t(lang, 'watchTitle')}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(lang, 'watchLead')} · {t(lang, 'tierWord')} 3</p>
              <ul className="mt-2.5 flex flex-col gap-1.5 text-sm leading-relaxed">
                {watch.map(({ crop, names }) => (
                  <li key={crop.id}><b>{crop.name[lang]}:</b> {names.join(lang === 'ar' ? '، ' : ', ')}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="fw-card border-plum-line bg-plum-tint" aria-label={t(lang, 'labs')}>
            <h2 className="fw-h2 text-plum">{t(lang, 'labs')}</h2>
            <ul className="mt-2.5 flex list-disc flex-col gap-1.5 ps-5 text-sm leading-relaxed text-plum-ink">
              {report.diagnostics.map((n, i) => <li key={i}>{renderNote(n, lang, dataset)}</li>)}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-6">
        <section className="fw-card min-w-0 flex-[1_1_560px]" aria-label={t(lang, 'findings')}>
          <h2 className="fw-h2">{t(lang, 'findings')}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {ndvi && (
              <RuleItem lang={lang} status="synced" meta={`MODIS MOD13Q1 · ${t(lang, 'tierWord')} 1`}
                text={t(lang, ndvi.bareMonths.length ? 'ndviFinding' : 'ndviFindingNone', {
                  period: ndvi.period, cycles: ndvi.cyclesPerYear.toFixed(1),
                  bare: ndvi.bareMonths.map((m) => monthName(lang, m)).join(lang === 'ar' ? '، ' : ', '),
                })} />
            )}
            {findings.map(({ n, dim }, i) => (
              <RuleItem key={i} lang={lang} status={statusOf(n.level)} text={renderNote(n, lang, dataset)} meta={`${t(lang, `rd_${dim}`)} · ${t(lang, 'tierWord')} ${n.tier}`} />
            ))}
          </ul>
        </section>
        <section className="fw-card min-w-0 flex-[1_1_420px]" aria-label={t(lang, 'others')}>
          <h2 className="fw-h2">{t(lang, 'others')}</h2>
          {ranked.slice(1).map((r) => {
            const weak = DIMENSIONS.map((d) => r.dims.find((x) => x.id === d)!).sort((a, b) => a.score - b.score)[0];
            return (
              <div key={r.id} className="flex justify-between gap-3 border-b border-soft py-3">
                <div className="min-w-0">
                  <b className="text-sm">{t(lang, 'optionWord')} {r.id} · {t(lang, `strategy${r.id}`)}</b>
                  <div className="mt-0.5 text-[13px] leading-relaxed text-muted">{t(lang, 'weakest', { dim: t(lang, `dim_${weak.id}`), score: Math.round(weak.score) })}</div>
                </div>
                <div dir="ltr" className="flex-none text-[22px] font-bold">{Math.round(r.total)}</div>
              </div>
            );
          })}
        </section>
      </div>

      <GapsBox lang={lang} />
      <TierLegend lang={lang} />
      <p className="mt-6 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">{t(lang, 'disclaimer')}</p>
      <div className="fw-foot no-print">
        <button type="button" className="fw-btn" onClick={onBack}>{t(lang, 'back')}</button>
        <button type="button" className="fw-btn" onClick={onRestart}>{t(lang, 'nav1')}</button>
      </div>
    </main>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div dir="ltr" className="mt-1 text-start text-xl font-bold">{value}</div>
      {unit && <div className="text-xs text-muted">{unit}</div>}
    </div>
  );
}
