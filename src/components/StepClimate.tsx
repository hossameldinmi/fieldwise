'use client';
import type { ClimateProfile, CropDataset, FarmInput, Lang, Level } from '@/lib/types';
import type { Report } from '@/lib/engine/evaluate';
import { buildSchedule } from '@/lib/engine/calendar';
import { IRRIGATION_EFFICIENCY, seasonStats, thermal } from '@/lib/engine/dimensions';
import { MONTH_DAYS, etMethod, monthlyPET } from '@/lib/nasa/climate';
import { monthName, t } from '@/lib/i18n';
import { governorateLabel } from '@/lib/geo/regions';
import { ArrowIcon, Bar, GapsBox, PageHead } from './ui';
import { NdviPanel, type NdviState } from './NdviPanel';

type SourceStatus = 'live' | 'earthdata' | 'copernicus' | 'planned';
const STATUS_KEY: Record<SourceStatus, string> = { live: 'srcLive', earthdata: 'srcEarthdata', copernicus: 'srcCopernicus', planned: 'srcPlanned' };
/** Data sources from the Space Apps resource list and whether this build reads them. */
const SATELLITES: { name: string; res: string; key: string; status: SourceStatus }[] = [
  { name: 'MODIS NDVI (MOD13Q1)', res: '250 m', key: 'sat5', status: 'live' },
  { name: 'GPM IMERG', res: '0.1°', key: 'sat2', status: 'earthdata' },
  { name: 'SMAP', res: '9 km', key: 'sat4', status: 'earthdata' },
  { name: 'SRTM', res: '30 m', key: 'sat3', status: 'earthdata' },
  { name: 'ECOSTRESS', res: '70 m', key: 'sat7', status: 'earthdata' },
  { name: 'GLDAS', res: '0.25°', key: 'sat8', status: 'earthdata' },
  { name: 'GRACE-FO', res: '~300 km', key: 'sat9', status: 'earthdata' },
  { name: 'Landsat', res: '30 m', key: 'sat6', status: 'earthdata' },
  { name: 'Sentinel-2', res: '10 m', key: 'sat1', status: 'copernicus' },
  { name: 'ERA5', res: '0.25°', key: 'sat11', status: 'copernicus' },
  { name: 'FAO GAEZ', res: '~9 km', key: 'sat10', status: 'planned' },
];
const WS_KEY: Record<Level, string> = { low: 'wsLow', medium: 'wsMedium', high: 'wsHigh' };

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const shortMonth = (lang: Lang, i: number) => (lang === 'ar' ? monthName(lang, i) : monthName(lang, i).slice(0, 1));

interface Props { lang: Lang; climate: ClimateProfile; report: Report; farm: FarmInput; dataset: CropDataset; ndvi: NdviState | null; stale: boolean; onBack: () => void; onNext: () => void }

export function StepClimate({ lang, climate, report, farm, dataset, ndvi, stale, onBack, onNext }: Props) {
  const m = climate.months;
  const pet = monthlyPET(climate).map((v, i) => v * MONTH_DAYS[i]);
  const rain = m.map((x, i) => x.precMmDay * MONTH_DAYS[i]);
  const annP = rain.reduce((a, b) => a + b, 0);
  const t2m = m.map((x) => x.t2m);
  const axisMax = Math.max(50, Math.ceil(Math.max(...pet, ...rain) / 50) * 50);
  const H = 220, WH = 180, TMAX = 45;
  const eff = Math.round(IRRIGATION_EFFICIENCY[farm.irrigation] * 100);
  const pm = etMethod(climate) === 'penman_monteith';
  const soil = m.every((x) => x.gwetRoot !== undefined) ? avg(m.map((x) => x.gwetRoot!)) : null;
  const frost = m.every((x) => x.frostDays !== undefined) ? m.reduce((a, x) => a + x.frostDays!, 0) : null;

  const ctx = { farm, climate, pathogens: dataset.pathogens, pet: monthlyPET(climate) };
  const crops = new Map(dataset.crops.map((c) => [c.id, c]));
  const fits = dataset.crops.filter((c) => c.season !== 'nili').map((c) => {
    const ps = buildSchedule({ id: 'A', years: 1, slots: [{ year: 0, season: c.season as 'winter' | 'summer', cropId: c.id }] }, crops);
    const stats = ps.map((p) => seasonStats(p, ctx));
    return { crop: c, score: Math.round(thermal(ps, stats).score), gdd: Math.round(stats[0].gdd) };
  }).sort((a, b) => b.score - a.score);

  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's2eye')} title={`${t(lang, 's2title')} · ${farm.governorate ? governorateLabel(farm.governorate, lang) : `${climate.lat.toFixed(2)}, ${climate.lng.toFixed(2)}`}`} />
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="fw-chip border-blue-line bg-blue-tint font-semibold text-blue">{t(lang, 'chipTier1')}</span>
        <span className="fw-chip">{t(lang, 'chipPower')}</span>
        <span className="fw-chip">{t(lang, 'chipGrid', { res: climate.resolution })}</span>
        <span className="fw-chip">{t(lang, 'chipBase', { period: climate.period })}</span>
      </div>
      {stale && <div role="status" className="mt-4 rounded-xl border border-amber-line bg-amber-tint px-4 py-3.5 text-sm leading-relaxed text-amber-ink">{t(lang, 'staleClimate')}</div>}

      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Kpi label={t(lang, 'kT')} value={`${avg(t2m).toFixed(1)} °C`} sub={`${Math.min(...t2m).toFixed(1)} → ${Math.max(...t2m).toFixed(1)} °C`} ltrSub />
        <Kpi label={t(lang, 'kP')} value={`${Math.round(annP)} mm`} sub={t(lang, annP < 150 ? 'kPsub' : 'kPsubWet')} />
        <Kpi label={t(lang, pm ? 'kPETpm' : 'kPET')} value={`${Math.round(report.climate.petMm).toLocaleString('en-US')} mm`} sub={t(lang, pm ? 'kPETsubPm' : 'kPETsub')} />
        <Kpi label={t(lang, 'kRH')} value={`${Math.round(avg(m.map((x) => x.rh)))} %`} sub={t(lang, 'kRHsub')} />
        <Kpi label={t(lang, 'kSW')} value={(avg(m.map((x) => x.radMJ)) / 3.6).toFixed(1)} sub={t(lang, 'kSWsub')} />
        {soil !== null && <Kpi label={t(lang, 'kSoil')} value={soil.toFixed(2)} sub={t(lang, 'kSoilSub')} />}
        {frost !== null && <Kpi label={t(lang, 'kFrost')} value={frost.toFixed(1)} sub={t(lang, 'kFrostSub')} />}
      </div>

      <div className="mt-6 flex flex-wrap gap-6">
        <section className="fw-card min-w-0 flex-[1_1_560px]" aria-label={t(lang, 'thermalTitle')}>
          <div className="flex flex-wrap justify-between gap-3">
            <h2 className="fw-h2">{t(lang, 'thermalTitle')}</h2>
            <div className="flex items-center gap-3.5 text-xs text-sub">
              <span className="flex items-center gap-1.5"><span className="h-3.5 w-2.5 rounded-[3px] bg-[#9FC2AE]" />{t(lang, 'legRangeMean')}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink" />{t(lang, 'legMean')}</span>
            </div>
          </div>
          <div dir="ltr" className="mt-[18px] flex gap-2.5">
            <div className="flex w-[30px] flex-col justify-between text-right font-mono text-[11px] text-muted" style={{ height: H }}><span>45°</span><span>30°</span><span>15°</span><span>0°</span></div>
            <div className="min-w-0 flex-1">
              <div className="relative flex gap-1.5 border-b border-field" style={{ height: H, backgroundImage: 'linear-gradient(#EEF0EB 1px, transparent 1px)', backgroundSize: `100% ${H / 3}px` }}>
                {m.map((x, i) => {
                  const lo = Math.max(0, x.tmin), hi = Math.min(TMAX, x.tmax);
                  return (
                    <div key={i} className="relative flex-1" title={`${monthName(lang, i)}: ${x.tmin.toFixed(1)}–${x.tmax.toFixed(1)} °C, ${x.t2m.toFixed(1)} °C`}>
                      <div className="absolute inset-x-[20%] rounded bg-[#9FC2AE]" style={{ bottom: (lo / TMAX) * H, height: ((hi - lo) / TMAX) * H }} />
                      <div className="absolute left-1/2 -ml-1 h-2 w-2 rounded-full bg-ink" style={{ bottom: (x.t2m / TMAX) * H - 4 }} />
                    </div>
                  );
                })}
              </div>
              <MonthAxis lang={lang} />
              {/* Bands follow the LTR month axis above, so they stay LTR in Arabic too. */}
              <div className="mt-3 grid grid-cols-12 gap-1.5 text-xs font-semibold">
                <div className="col-span-4 rounded-md bg-blue-tint px-2 py-1.5 text-blue" lang={lang}>{t(lang, 'winterBand')}</div>
                <div className="col-span-5 rounded-md bg-amber-tint px-2 py-1.5 text-amber">{t(lang, 'summerBand')}</div>
                <div className="col-span-2 rounded-md bg-plum-band px-2 py-1.5 text-plum">{t(lang, 'niliBand')}</div>
                <div className="col-span-1 rounded-md bg-blue-tint" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        <section className="fw-card min-w-0 flex-[1_1_460px]" aria-label={t(lang, 'waterTitle')}>
          <div className="flex flex-wrap justify-between gap-3">
            <h2 className="fw-h2">{t(lang, 'waterTitle')}</h2>
            <div className="flex items-center gap-3.5 text-xs text-sub">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-deep" />{t(lang, 'legP')}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#E2B884]" />{t(lang, 'legPET')}</span>
            </div>
          </div>
          <div dir="ltr" className="mt-[18px] flex gap-2.5">
            <div className="flex w-[34px] flex-col justify-between text-right font-mono text-[11px] text-muted" style={{ height: WH }}><span>{axisMax}</span><span>{axisMax / 2}</span><span>0</span></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-end gap-1.5 border-b border-field" style={{ height: WH }}>
                {m.map((_, i) => (
                  <div key={i} className="flex h-full flex-1 items-end gap-0.5" title={`${monthName(lang, i)}: ${Math.round(rain[i])} / ${Math.round(pet[i])} mm`}>
                    <div className="flex-1 rounded-t-sm bg-blue-deep" style={{ height: Math.max(rain[i] > 0.5 ? 2 : 0, (rain[i] / axisMax) * WH) }} />
                    <div className="flex-1 rounded-t-sm bg-[#E2B884]" style={{ height: (pet[i] / axisMax) * WH }} />
                  </div>
                ))}
              </div>
              <MonthAxis lang={lang} />
            </div>
          </div>
          <div className="mt-[18px] grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-line px-3.5 py-3">
              <div className="text-xs text-muted">{t(lang, 'deficit')}</div>
              <div dir="ltr" className="mt-1 text-start text-[22px] font-semibold text-amber">{Math.round(report.climate.deficitMm).toLocaleString('en-US')} mm</div>
              <div className="mt-0.5 text-xs text-muted">{t(lang, 'tier2computed')}</div>
            </div>
            <div className="rounded-[10px] border border-green-line bg-green-tint px-3.5 py-3">
              <div className="text-xs text-green-ink">{t(lang, 'irrSec')}</div>
              <div className="mt-1 text-base font-bold text-green-dark">{t(lang, WS_KEY[farm.water])}</div>
              <div className="mt-0.5 text-xs text-green-ink">{t(lang, 'effLine', { name: t(lang, farm.irrigation), eff })}</div>
            </div>
          </div>
          <p className="mt-3.5 text-[13px] leading-relaxed text-sub">{t(lang, 'waterExplain')}</p>
        </section>
      </div>

      <section className="fw-card mt-6" aria-label={t(lang, 'cropFit')}>
        <h2 className="fw-h2">{t(lang, 'cropFit')}</h2>
        <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-7 gap-y-2.5">
          {fits.map((f) => (
            <div key={f.crop.id} className="flex items-center gap-3 border-b border-track py-2">
              <div className="w-[120px] flex-none">
                <div className="text-sm font-semibold">{f.crop.name[lang]}</div>
                <div className="text-xs text-muted">{t(lang, f.crop.season)} · {t(lang, 'gdd')} {f.gdd.toLocaleString('en-US')}</div>
              </div>
              <Bar value={f.score} color={f.score >= 75 ? '#1D6B47' : f.score >= 50 ? '#C2630A' : '#9B2C1F'} />
              <span className="w-[30px] text-end font-mono text-sm font-semibold">{f.score}</span>
            </div>
          ))}
        </div>
      </section>

      <NdviPanel lang={lang} state={ndvi} />

      <section className="mt-6" aria-label={t(lang, 'satTitle')}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="fw-h2 text-lg">{t(lang, 'satTitle')}</h2><span className="text-[13px] text-muted">{t(lang, 'satSub')}</span>
        </div>
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {SATELLITES.map((s) => (
            <div key={s.name} className={`rounded-xl border bg-white px-[18px] py-4 ${s.status === 'live' ? 'border-green-line' : 'border-dashed border-[#B9C4B5]'}`}>
              <div className="flex justify-between gap-2"><b className="text-[15px]">{s.name}</b><span className="font-mono text-xs text-muted" dir="ltr">{s.res}</span></div>
              <p className="mt-2 text-[13px] leading-relaxed text-sub">{t(lang, s.key)}</p>
              <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.status === 'live' ? 'bg-green-tint text-green-dark' : 'bg-paper text-muted'}`}>{t(lang, STATUS_KEY[s.status])}</span>
            </div>
          ))}
        </div>
      </section>

      <GapsBox lang={lang} />

      <div className="fw-foot no-print">
        <button type="button" className="fw-btn" onClick={onBack}>{t(lang, 'back')}</button>
        <button type="button" className="fw-btn fw-pri" onClick={onNext}>{t(lang, 'toRot')}<ArrowIcon /></button>
      </div>
    </main>
  );
}

function Kpi({ label, value, sub, ltrSub }: { label: string; value: string; sub: string; ltrSub?: boolean }) {
  return (
    <div className="fw-card px-[18px] py-4">
      <div className="font-mono text-xs text-muted">{label}</div>
      <div className="fw-kpi text-start" dir="ltr">{value}</div>
      <div className="text-start text-[13px] text-muted" dir={ltrSub ? 'ltr' : undefined}>{sub}</div>
    </div>
  );
}

function MonthAxis({ lang }: { lang: Lang }) {
  return (
    <div className="mt-1.5 flex gap-1.5">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-muted">{shortMonth(lang, i)}</div>
      ))}
    </div>
  );
}
