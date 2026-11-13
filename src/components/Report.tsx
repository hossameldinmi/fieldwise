'use client';
import { useEffect, useRef } from 'react';
import type { ClimateProfile, CropDataset, Lang, Note } from '@/lib/types';
import type { Report as ReportData } from '@/lib/engine/evaluate';
import { DIMENSIONS, DIMENSION_WEIGHTS } from '@/lib/engine/dimensions';
import { TIER_KEYS, renderNote, t } from '@/lib/i18n';
import { STRATEGY_COLORS, scoreTone } from '@/lib/ui';
import { TierBadge } from './TierBadge';
import { FamilyLegend, RotationStrip } from './RotationStrip';
import { ClimateChart, ScoreRadar } from './Charts';

const LEVEL_MARK: Record<Note['level'], string> = { info: 'border-line', warn: 'border-straw', risk: 'border-blight' };

function NoteList({ notes, lang, ds }: { notes: Note[]; lang: Lang; ds: CropDataset }) {
  return (
    <ul className="space-y-1.5">
      {notes.map((n, i) => (
        <li key={i} className={`flex items-start gap-2 border-s-[3px] ps-2 text-[15px] leading-relaxed ${LEVEL_MARK[n.level]}`}>
          <TierBadge tier={n.tier} lang={lang} />
          <span>{renderNote(n, lang, ds)}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page space-y-3 border-t border-line pt-6">
      <h2 className="text-xl font-semibold tracking-tight text-silt">{title}</h2>
      {children}
    </section>
  );
}

interface Props { report: ReportData; climate: ClimateProfile; verification: Note[]; lang: Lang; ds: CropDataset; farmName: string }

export function Report({ report, climate, verification, lang, ds, farmName }: Props) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const open = () => root.current?.querySelectorAll('details').forEach((d) => (d.open = true));
    window.addEventListener('beforeprint', open);
    return () => window.removeEventListener('beforeprint', open);
  }, []);
  const best = [...report.results].sort((a, b) => b.total - a.total)[0];
  const families = [...new Set(report.results.flatMap((r) => r.plantings.map((p) => p.crop.family)))];

  return (
    <div ref={root} className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-siltSoft">{farmName}, {climate.lat.toFixed(4)}°, {climate.lng.toFixed(4)}°, {report.hectares.toFixed(2)} ha</p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-silt">
          {t(lang, 'bestFit', { name: t(lang, `strategy${best.id}`), id: best.id, score: Math.round(best.total) })}
        </h2>
      </header>

      <Section title={t(lang, 'rotations')}>
        <FamilyLegend lang={lang} families={families} />
        <div className="space-y-5">
          {report.results.map((r) => (
            <div key={r.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  <span className="me-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: STRATEGY_COLORS[r.id] }} />
                  {t(lang, 'option', { id: r.id })}: {t(lang, `strategy${r.id}`)}
                  <span className="ms-2 text-sm font-normal text-siltSoft">{t(lang, `strategy${r.id}sub`)}</span>
                </h3>
                <span className={`text-2xl font-semibold tabular-nums ${scoreTone(r.total)}`}>{Math.round(r.total)}</span>
              </div>
              <RotationStrip result={r} lang={lang} ds={ds} />
            </div>
          ))}
        </div>
      </Section>

      <Section title={t(lang, 'comparison')}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[15px] print:text-[12px]">
            <thead>
              <tr className="border-b-2 border-silt text-start align-bottom">
                <th scope="col" className="py-2 pe-3 text-start font-semibold">{t(lang, 'dimension')}</th>
                <th scope="col" className="px-2 py-2 text-end font-semibold">{t(lang, 'weight')}</th>
                {report.results.map((r) => (
                  <th key={r.id} scope="col" className="whitespace-normal px-2 py-2 text-end font-semibold" style={{ color: STRATEGY_COLORS[r.id] }}>
                    {r.id}<span className="block text-xs font-normal text-siltSoft">{t(lang, `strategy${r.id}`)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d} className="border-b border-line">
                  <th scope="row" className="py-2 pe-3 text-start font-normal">{t(lang, `dim_${d}`)}</th>
                  <td className="px-2 py-2 text-end tabular-nums text-siltSoft">{DIMENSION_WEIGHTS[d] * 100}%</td>
                  {report.results.map((r) => {
                    const s = r.dims.find((x) => x.id === d)!.score;
                    return (
                      <td key={r.id} className="px-2 py-2 text-end">
                        <span className={`tabular-nums font-semibold ${scoreTone(s)}`}>{Math.round(s)}</span>
                        <span className="ms-2 inline-block h-1.5 w-14 rounded-full bg-line align-middle print:hidden">
                          <span className="block h-1.5 rounded-full" style={{ width: `${s}%`, background: STRATEGY_COLORS[r.id] }} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-silt">
                <th scope="row" className="py-2 pe-3 text-start font-semibold">{t(lang, 'total')}</th>
                <td className="px-2 py-2 text-end tabular-nums">100%</td>
                {report.results.map((r) => (
                  <td key={r.id} className={`px-2 py-2 text-end text-lg font-semibold tabular-nums ${scoreTone(r.total)}`}>{r.total.toFixed(1)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t(lang, 'profile')}>
        <ScoreRadar results={report.results} lang={lang} />
      </Section>

      <Section title={t(lang, 'climate')}>
        <p className="flex items-start gap-2 text-[15px]"><TierBadge tier={1} lang={lang} />
          <span>{t(lang, 'climateSource', { source: climate.source, period: climate.period, res: climate.resolution })}</span></p>
        <ClimateChart climate={climate} lang={lang} />
        <NoteList notes={[report.climate.deficitNote]} lang={lang} ds={ds} />
      </Section>

      {verification.length > 0 && (
        <Section title={t(lang, 'verification')}><NoteList notes={verification} lang={lang} ds={ds} /></Section>
      )}

      <Section title={t(lang, 'details')}>
        {report.results.map((r) => (
          <details key={r.id} className="group rounded-md border border-line bg-white open:pb-3">
            <summary className="cursor-pointer select-none px-4 py-3 text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-berseem">
              {t(lang, 'option', { id: r.id })}: {t(lang, `strategy${r.id}`)}
            </summary>
            <div className="space-y-4 px-4">
              {r.dims.map((d) => (
                <div key={d.id} className="break-inside-avoid space-y-1.5">
                  <h4 className="font-semibold">{t(lang, `dim_${d.id}`)} <span className={`tabular-nums ${scoreTone(d.score)}`}>{Math.round(d.score)}</span></h4>
                  <NoteList notes={d.notes} lang={lang} ds={ds} />
                </div>
              ))}
            </div>
          </details>
        ))}
      </Section>

      <div className="grid gap-8 md:grid-cols-2 print:grid-cols-2">
        <Section title={t(lang, 'amendments')}><NoteList notes={report.amendments} lang={lang} ds={ds} /></Section>
        <Section title={t(lang, 'diagnostics')}><NoteList notes={report.diagnostics} lang={lang} ds={ds} /></Section>
      </div>

      <Section title={t(lang, 'tiers')}>
        <dl className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
          {TIER_KEYS.map((k) => (
            <div key={k} className="flex items-start gap-2">
              <TierBadge tier={k} lang={lang} />
              <div><dt className="font-semibold">{t(lang, `tier${k}`)}</dt><dd className="text-sm text-siltSoft">{t(lang, `tier${k}d`)}</dd></div>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}
