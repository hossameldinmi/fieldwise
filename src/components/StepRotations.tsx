'use client';
import type { CropDataset, Lang, Note } from '@/lib/types';
import type { Report, StrategyResult } from '@/lib/engine/evaluate';
import type { StrategyId } from '@/lib/engine/strategies';
import { DIMENSIONS, DIMENSION_WEIGHTS } from '@/lib/engine/dimensions';
import { renderNote, seasonText, t } from '@/lib/i18n';
import { STRATEGY_COLORS, STRATEGY_DASH, familyColor, scoreColor, statusOf } from '@/lib/ui';
import { ArrowIcon, Bar, PageHead, RuleItem } from './ui';

const LEVEL_ORDER: Record<Note['level'], number> = { risk: 0, warn: 1, info: 2 };
const CX = 220, CY = 200, R = 140;
/** Radar label anchors, clockwise from the top axis. */
const LABELS: [number, number, 'middle' | 'start' | 'end'][] = [
  [220, 34, 'middle'], [336, 84, 'start'], [372, 204, 'start'], [336, 324, 'start'],
  [220, 378, 'middle'], [104, 324, 'end'], [68, 204, 'end'], [104, 84, 'end'],
];
const axis = (i: number, r: number) => {
  const a = (-90 + 45 * i) * (Math.PI / 180);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const ring = (r: number) => DIMENSIONS.map((_, i) => axis(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');

interface Props {
  lang: Lang; report: Report; dataset: CropDataset; selected: StrategyId; onSelect: (id: StrategyId) => void;
  custom: string[]; onCustom: (c: string[]) => void; onBack: () => void; onNext: () => void;
}

export function StepRotations({ lang, report, dataset, selected, onSelect, custom, onCustom, onBack, onNext }: Props) {
  const results = report.results;
  const best = Math.max(...results.map((r) => r.total));
  const sel = results.find((r) => r.id === selected) ?? results[0];
  const crop = (id: string) => dataset.crops.find((c) => c.id === id);
  const name = (r: StrategyResult) => t(lang, `strategy${r.id}`);

  const rules = sel.dims
    .flatMap((d) => d.notes.map((n) => ({ n, dim: d.id })))
    .sort((a, b) => LEVEL_ORDER[a.n.level] - LEVEL_ORDER[b.n.level]);

  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's3eye')} title={t(lang, 's3title')} lead={t(lang, 's3lead')} />

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4">
        {results.map((r) => {
          const on = r.id === sel.id;
          const fams = [...new Set(r.plantings.map((p) => p.crop.family))];
          return (
            <button key={r.id} type="button" onClick={() => onSelect(r.id)} aria-pressed={on}
              className="rounded-[14px] bg-white px-5 py-[18px] text-start text-ink"
              style={{ border: `2px solid ${on ? STRATEGY_COLORS[r.id] : '#DCE0D8'}`, boxShadow: on ? '0 2px 10px rgba(21,32,27,0.08)' : undefined }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: STRATEGY_COLORS[r.id] }} />
                    <span className="font-mono text-xs tracking-[0.06em] text-muted">{t(lang, 'optionWord')} {r.id}</span>
                    {r.total === best && <span className="rounded-full bg-green px-2 py-0.5 text-[11px] font-semibold text-white">{t(lang, 'topScore')}</span>}
                  </div>
                  <div className="mt-1.5 text-base font-semibold leading-snug">{name(r)}</div>
                </div>
                <div className="text-end">
                  <div dir="ltr" className="text-[32px] font-bold leading-none">{Math.round(r.total)}</div>
                  <div className="mt-0.5 text-xs text-muted">{t(lang, 'of100')}</div>
                </div>
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-x-3.5 gap-y-2.5 border-t border-soft pt-3">
                <Stat label={t(lang, 'cycle')} value={t(lang, 'cycleVal', { y: r.strategy.years, s: r.strategy.slots.length })} />
                <Stat label={t(lang, 'families')} value={`${fams.length} · ${fams.map((f) => t(lang, f).replace(/\s*\(.*\)$/, '')).join(', ')}`} />
                <Stat label={t(lang, 'ncredit')} value={`${r.metrics.nCreditMid.toFixed(0)} ${t(lang, 'kgNha')}`} />
                <Stat label={t(lang, 'waterYr')} value={`${Math.round(r.metrics.grossWaterMmYr).toLocaleString('en-US')} ${t(lang, 'perYr')}`} />
              </div>
            </button>
          );
        })}
      </div>

      {sel.id === 'D' && (
        <section className="fw-card mt-4 border-2 border-[#7B4FA0]" aria-label={t(lang, 'builder')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="fw-h2">{t(lang, 'builder')}</h2><p className="mt-1 text-[13px] text-muted">{t(lang, 'builderSub')}</p></div>
            <div className="fw-seg" role="group" aria-label={t(lang, 'cycle')}>
              {[4, 8].map((n) => (
                <button key={n} type="button" className="fw-seg-btn min-h-[44px]" aria-pressed={custom.length === n}
                  onClick={() => onCustom(n === 4 ? custom.slice(0, 4) : [...custom, ...custom].slice(0, 8))}>
                  {t(lang, n === 4 ? 'len4' : 'len8')}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {custom.map((id, i) => {
              const season = i % 2 === 0 ? 'winter' : 'summer';
              const opts = dataset.crops.filter((c) => c.season === season);
              return (
                <div key={i}>
                  <label className="fw-lbl" htmlFor={`slot-${i}`}>{t(lang, 'slot', { y: Math.floor(i / 2) + 1, s: t(lang, season) })}</label>
                  <select id={`slot-${i}`} className="fw-in" value={id} onChange={(e) => onCustom(custom.map((x, j) => (j === i ? e.target.value : x)))}>
                    {opts.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="fw-card mt-6" aria-label={t(lang, 'timeline')}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="fw-h2">{t(lang, 'timeline')}</h2>
          <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-3 w-3 rounded-[3px] border border-dashed border-[#6B7570]" />{t(lang, 'repeats')}</span>
        </div>
        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="mb-1.5 grid grid-cols-[110px_repeat(9,minmax(0,1fr))] gap-1.5">
              <div />
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="font-mono text-[11px] text-muted">{seasonText(lang, `${Math.floor(i / 2) + 1}|${i % 2 === 0 ? 'winter' : 'summer'}`)}</div>
              ))}
            </div>
            {results.map((r) => {
              const n = r.strategy.slots.length;
              return (
                <div key={r.id} className="mb-1.5 grid grid-cols-[110px_repeat(9,minmax(0,1fr))] gap-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: STRATEGY_COLORS[r.id] }} />{t(lang, 'optionWord')} {r.id}
                  </div>
                  {Array.from({ length: 9 }, (_, i) => {
                    const c = crop(r.strategy.slots[i % n].cropId);
                    const rep = i >= n, ret = i === 8 && n === 8;
                    return (
                      <div key={i} className="box-border min-h-[54px] rounded-lg p-2.5"
                        style={{
                          background: rep && !ret ? '#FFFFFF' : familyColor(c?.family ?? ''),
                          border: ret ? '2px solid #15201B' : rep ? '1px dashed #8A948E' : '1px solid transparent',
                        }}>
                        <div className="text-[13px] font-semibold leading-tight">{c?.name[lang] ?? r.strategy.slots[i % n].cropId}</div>
                        <div className="mt-0.5 text-[11px] text-sub">{ret ? t(lang, 'returns') : t(lang, c?.family ?? '').replace(/\s*\(.*\)$/, '')}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <p className="mt-2.5 text-[13px] text-muted">{t(lang, 'timelineNote')}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-6">
        <section className="fw-card min-w-0 flex-[1_1_440px]" aria-label={t(lang, 'radarTitle')}>
          <h2 className="fw-h2">{t(lang, 'radarTitle')}</h2>
          <p className="mt-1 text-[13px] text-muted">{t(lang, 'radarSub')}</p>
          <div dir="ltr">
            <svg viewBox="-50 0 540 390" role="img" aria-label={t(lang, 'radarAria')} className="mx-auto mt-2 block h-auto w-full max-w-[540px]">
              <g fill="none" stroke="#E1E5DE" strokeWidth="1">
                {[0.25, 0.5, 0.75].map((f) => <polygon key={f} points={ring(R * f)} />)}
                <polygon points={ring(R)} stroke="#C9CFC6" />
                {DIMENSIONS.map((_, i) => { const [x, y] = axis(i, R); return <path key={i} d={`M${CX} ${CY}L${x.toFixed(1)} ${y.toFixed(1)}`} />; })}
              </g>
              {[...results.filter((r) => r.id !== sel.id), sel].map((r) => {
                const on = r.id === sel.id;
                const pts = DIMENSIONS.map((d, i) => axis(i, (R * r.dims.find((x) => x.id === d)!.score) / 100).map((v) => v.toFixed(1)).join(',')).join(' ');
                return (
                  <polygon key={r.id} points={pts} fill={STRATEGY_COLORS[r.id]} fillOpacity={on ? 0.18 : 0}
                    stroke={STRATEGY_COLORS[r.id]} strokeWidth={on ? 3 : 1.5} strokeDasharray={STRATEGY_DASH[r.id]} />
                );
              })}
              <g fontSize="13" fill="#15201B">
                {DIMENSIONS.map((d, i) => <text key={d} x={LABELS[i][0]} y={LABELS[i][1]} textAnchor={LABELS[i][2]}>{t(lang, `rd_${d}`)}</text>)}
              </g>
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-4 text-[13px] text-sub">
            {results.map((r) => (
              <span key={r.id} className="flex items-center gap-1.5">
                <svg width="22" height="6" aria-hidden="true"><path d="M0 3h22" stroke={STRATEGY_COLORS[r.id]} strokeWidth={r.id === 'B' ? 3 : 2} strokeDasharray={STRATEGY_DASH[r.id]} /></svg>{r.id}
              </span>
            ))}
          </div>
        </section>

        <section className="fw-card min-w-0 flex-[1_1_520px]" aria-label={t(lang, 'whyTitle')}>
          <h2 className="fw-h2">{t(lang, 'whyTitle')} · {t(lang, 'optionWord')} {sel.id} = {Math.round(sel.total)}</h2>
          <p className="mt-1 text-[13px] text-muted">{t(lang, 'whySub')}</p>
          <ul className="mt-3.5 flex max-h-[560px] flex-col gap-2 overflow-y-auto pe-1">
            {rules.map(({ n, dim }, i) => (
              <RuleItem key={i} boxed lang={lang} status={statusOf(n.level)} text={renderNote(n, lang, dataset)}
                meta={`${t(lang, `rd_${dim}`)} · ${t(lang, 'tierWord')} ${n.tier}`} />
            ))}
          </ul>
        </section>
      </div>

      <section className="fw-card mt-6" aria-label={t(lang, 'matrix')}>
        <h2 className="fw-h2">{t(lang, 'matrix')}</h2>
        <div className="mt-2.5 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-field text-[13px] font-semibold text-sub">
                <th scope="col" className="px-1 py-3 text-start">{t(lang, 'dimension')}</th>
                <th scope="col" className="w-[70px] px-1 py-3 text-start">{t(lang, 'weight')}</th>
                {results.map((r) => <th key={r.id} scope="col" className="px-1 py-3 text-start">{r.id} · {name(r)}</th>)}
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d} className="border-b border-soft">
                  <th scope="row" className="px-1 py-[11px] text-start text-sm font-medium">{t(lang, `dim_${d}`)}</th>
                  <td className="px-1 font-mono text-[13px] text-muted">{DIMENSION_WEIGHTS[d] * 100}%</td>
                  {results.map((r) => {
                    const s = r.dims.find((x) => x.id === d)!.score;
                    return (
                      <td key={r.id} className="px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 text-sm font-semibold tabular-nums" style={{ color: scoreColor(s) }}>{Math.round(s)}</span>
                          <Bar value={s} color={STRATEGY_COLORS[r.id]} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-1 py-3 text-start text-[15px] font-bold">{t(lang, 'wtotal')}</th>
                <td className="px-1 font-mono text-[13px]">100%</td>
                {results.map((r) => <td key={r.id} className="px-1 text-xl font-bold tabular-nums">{Math.round(r.total)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="fw-foot no-print">
        <button type="button" className="fw-btn" onClick={onBack}>{t(lang, 'back')}</button>
        <button type="button" className="fw-btn fw-pri" onClick={onNext}>{t(lang, 'toReport')}<ArrowIcon /></button>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-muted">{label}</div><div className="mt-0.5 text-[13px] font-medium">{value}</div></div>;
}
