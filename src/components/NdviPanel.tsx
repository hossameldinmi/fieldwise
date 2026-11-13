'use client';
import type { Lang } from '@/lib/types';
import { BARE_NDVI, GREEN_NDVI, type NdviProfile } from '@/lib/nasa/modis';
import { monthName, t } from '@/lib/i18n';

export type NdviState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; data: NdviProfile };

const W = 1100, H = 220, PAD = 32;

/** MODIS NDVI time series at the farm pin with bare-soil and green thresholds. */
export function NdviPanel({ lang, state }: { lang: Lang; state: NdviState | null }) {
  return (
    <section className="fw-card mt-6" aria-label={t(lang, 'ndviTitle')}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="fw-h2">{t(lang, 'ndviTitle')}</h2>
        <span className="fw-chip border-blue-line bg-blue-tint font-semibold text-blue">{t(lang, 'chipTier1')} · MODIS MOD13Q1 · 250 m</span>
      </div>
      {!state || state.status === 'loading' ? (
        <div className="mt-4 h-[170px] animate-pulse rounded-lg bg-track" aria-busy="true"><span className="sr-only">{t(lang, 'ndviLoading')}</span></div>
      ) : state.status === 'error' ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-line bg-red-tint p-3 text-sm text-red">{t(lang, 'ndviError', { msg: state.message })}</p>
      ) : (
        <NdviBody lang={lang} d={state.data} />
      )}
    </section>
  );
}

function NdviBody({ lang, d }: { lang: Lang; d: NdviProfile }) {
  const t0 = Date.parse(d.series[0].date), t1 = Date.parse(d.series[d.series.length - 1].date);
  const x = (date: string) => PAD + ((Date.parse(date) - t0) / Math.max(1, t1 - t0)) * (W - PAD - 8);
  const y = (v: number) => 8 + (1 - Math.max(0, Math.min(1, v))) * (H - 24);
  const path = d.series.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.ndvi).toFixed(1)}`).join('');
  const years = [...new Set(d.series.map((p) => p.date.slice(0, 4)))];
  const bare = d.bareMonths.map((m) => monthName(lang, m)).join(lang === 'ar' ? '، ' : ', ');

  return (
    <>
      <div dir="ltr" className="mt-4">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(lang, 'ndviAria', { period: d.period })} className="block h-auto w-full">
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={PAD} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#EEF0EB" />
              <text x={PAD - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="#4F5B55" fontFamily="IBM Plex Mono, monospace">{v}</text>
            </g>
          ))}
          <rect x={PAD} y={y(BARE_NDVI)} width={W - PAD - 8} height={y(0) - y(BARE_NDVI)} fill="#FBEEDD" opacity="0.7" />
          <line x1={PAD} x2={W - 8} y1={y(GREEN_NDVI)} y2={y(GREEN_NDVI)} stroke="#B5D3C0" strokeDasharray="4 3" />
          <path d={path} fill="none" stroke="#1D6B47" strokeWidth="2" strokeLinejoin="round" />
          {d.series.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.ndvi)} r="2" fill="#1D6B47"><title>{`${p.date}: ${p.ndvi.toFixed(2)}`}</title></circle>)}
          {years.map((yr) => {
            const xx = x(`${yr}-01-01`);
            return xx >= PAD ? <text key={yr} x={xx} y={H - 2} fontSize="10" fill="#4F5B55" fontFamily="IBM Plex Mono, monospace">{yr}</text> : null;
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-sub">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-amber-tint ring-1 ring-amber-line" />{t(lang, 'ndviBareBand', { v: BARE_NDVI })}</span>
        <span className="flex items-center gap-1.5"><svg width="18" height="6" aria-hidden="true"><path d="M0 3h18" stroke="#B5D3C0" strokeDasharray="4 3" strokeWidth="2" /></svg>{t(lang, 'ndviGreenLine', { v: GREEN_NDVI })}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t(lang, 'ndviBare')} value={bare || t(lang, 'ndviNone')} />
        <Stat label={t(lang, 'ndviCycles')} value={d.cyclesPerYear.toFixed(1)} />
        <Stat label={t(lang, 'ndviLatest')} value={d.latest ? `${d.latest.ndvi.toFixed(2)} · ${d.latest.date}` : '—'} ltr />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">{t(lang, 'ndviNote')}</p>
    </>
  );
}

function Stat({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-[10px] border border-line px-3.5 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-start text-[15px] font-semibold" dir={ltr ? 'ltr' : undefined}>{value}</div>
    </div>
  );
}
