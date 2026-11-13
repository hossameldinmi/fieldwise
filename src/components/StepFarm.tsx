'use client';
import dynamic from 'next/dynamic';
import type { AreaUnit, CropDataset, FarmInput, Irrigation, Lang, Level, Note } from '@/lib/types';
import { TEXTURES } from '@/lib/types';
import type { CurrentRotation } from '@/lib/engine/strategies';
import type { Verification } from '@/lib/geo/verify';
import { soilAmendments } from '@/lib/engine/amendments';
import { IRRIGATION_EFFICIENCY } from '@/lib/engine/dimensions';
import { GOVERNORATES } from '@/lib/geo/regions';
import { renderNote, t } from '@/lib/i18n';
import { convertArea } from '@/lib/units';
import { STATUS_STYLE, type Status } from '@/lib/ui';
import { ArrowIcon, PageHead, StatusBadge } from './ui';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <div className="h-[340px] w-full animate-pulse bg-track" /> });

const PRESETS = [
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', lat: 31.0964, lng: 30.9426 },
  { en: 'Sharqia', ar: 'الشرقية', lat: 30.5877, lng: 31.502 },
  { en: 'Ismailia', ar: 'الإسماعيلية', lat: 30.6043, lng: 32.2723 },
  { en: 'Nubaria', ar: 'النوبارية', lat: 30.6667, lng: 30.0667 },
  { en: 'Minya', ar: 'المنيا', lat: 28.0871, lng: 30.7618 },
  { en: 'Aswan', ar: 'أسوان', lat: 24.0889, lng: 32.8998 },
];

const UNITS: { u: AreaUnit; key: string }[] = [{ u: 'feddan', key: 'unitFd' }, { u: 'hectare', key: 'unitHa' }, { u: 'acre', key: 'unitAc' }];
const IRRIGATIONS: Irrigation[] = ['surface', 'canal_flood', 'sprinkler', 'drip'];
const LEVELS: Level[] = ['low', 'medium', 'high'];
const WS_KEY: Record<Level, string> = { low: 'wsLow', medium: 'wsMedium', high: 'wsHigh' };

interface Check { status: Status; title: string; body: string; action?: { label: string; run: () => void } }

interface Props {
  lang: Lang; farm: FarmInput; onFarm: (f: FarmInput) => void;
  current: CurrentRotation; onCurrent: (c: CurrentRotation) => void;
  dataset: CropDataset; verification: Verification; busy: boolean; error: string | null; onAnalyze: () => void;
}

export function StepFarm({ lang, farm, onFarm, current, onCurrent, dataset, verification, busy, error, onAnalyze }: Props) {
  const set = <K extends keyof FarmInput>(k: K, v: FarmInput[K]) => onFarm({ ...farm, [k]: v });
  const num = (v: string) => (v.trim() === '' ? NaN : Number(v));
  const gov = verification.governorate;

  const checks = buildChecks(lang, farm, verification, dataset, (name) => onFarm({ ...farm, governorate: name }));
  const winterCrops = dataset.crops.filter((c) => c.season === 'winter');
  const summerCrops = dataset.crops.filter((c) => c.season === 'summer');
  const others = UNITS.filter((x) => x.u !== farm.areaUnit)
    .map((x) => `= ${convertArea(farm.area || 0, farm.areaUnit, x.u).toFixed(2)} ${t(lang, x.key)}`).join('   ·   ');

  return (
    <main className="fw-wrap">
      <PageHead eyebrow={t(lang, 's1eye')} title={t(lang, 's1title')} lead={t(lang, 's1lead')} />

      <div className="mt-6 flex flex-wrap items-start gap-6">
        <section className="fw-card min-w-0 flex-[1_1_560px] overflow-hidden p-0" aria-label={t(lang, 'farmLocation')}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-[18px] py-3">
            <h2 className="fw-h2">{t(lang, 'farmLocation')}</h2>
          </div>
          <div className="relative" dir="ltr">
            <MapPicker lat={farm.lat} lng={farm.lng} onPick={(lat, lng) => onFarm({ ...farm, lat, lng })} />
            <div className="pointer-events-none absolute right-2.5 top-2.5 z-[400] rounded-md bg-white/90 px-2 py-1 text-[11px] text-sub">{t(lang, 'mapNote')}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-[18px] py-3">
            <span className="text-[13px] text-muted">{t(lang, 'tryPreset')}</span>
            {PRESETS.map((p) => (
              <button key={p.en} type="button" className="fw-btn fw-btn-sm" onClick={() => onFarm({ ...farm, lat: p.lat, lng: p.lng })}>{p[lang]}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 border-t border-line px-[18px] py-3.5 sm:grid-cols-3">
            <div>
              <label className="fw-lbl" htmlFor="fw-lat">{t(lang, 'latitude')}</label>
              <input id="fw-lat" className="fw-in font-mono" dir="ltr" inputMode="decimal" value={Number.isFinite(farm.lat) ? farm.lat : ''} onChange={(e) => set('lat', num(e.target.value))} />
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-lng">{t(lang, 'longitude')}</label>
              <input id="fw-lng" className="fw-in font-mono" dir="ltr" inputMode="decimal" value={Number.isFinite(farm.lng) ? farm.lng : ''} onChange={(e) => set('lng', num(e.target.value))} />
            </div>
            <div>
              <div className="fw-lbl">{t(lang, 'verified')}</div>
              <div className="flex min-h-[44px] items-center text-base font-bold text-green-dark">{gov ? gov.name[lang] : t(lang, 'notVerified')}</div>
            </div>
          </div>
        </section>

        <section className="fw-card min-w-0 flex-[1_1_460px]" aria-label={t(lang, 'farmProfile')}>
          <h2 className="fw-h2 mb-4">{t(lang, 'farmProfile')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="fw-lbl" htmlFor="fw-name">{t(lang, 'farmName')}</label>
              <input id="fw-name" className="fw-in" value={farm.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="fw-lbl" htmlFor="fw-area">{t(lang, 'area')}</label>
              <div className="flex flex-wrap gap-2">
                <input id="fw-area" className="fw-in w-auto flex-[1_1_120px] font-mono" dir="ltr" inputMode="decimal" value={Number.isFinite(farm.area) ? farm.area : ''} onChange={(e) => set('area', num(e.target.value))} />
                <div className="fw-seg" role="group" aria-label={t(lang, 'area')}>
                  {UNITS.map(({ u, key }) => (
                    <button key={u} type="button" className="fw-seg-btn min-h-[44px]" aria-pressed={farm.areaUnit === u}
                      onClick={() => onFarm({ ...farm, areaUnit: u, area: Number(convertArea(farm.area || 0, farm.areaUnit, u).toFixed(2)) })}>
                      {t(lang, key)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1.5 text-start font-mono text-xs text-muted" dir="ltr">{others}</div>
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-country">{t(lang, 'country')}</label>
              <input id="fw-country" className="fw-in" value={farm.country} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-gov">{t(lang, 'govTyped')}</label>
              <select id="fw-gov" className="fw-in" value={GOVERNORATES.find((g) => g.name.en === farm.governorate || g.name.ar === farm.governorate)?.name.en ?? ''}
                onChange={(e) => set('governorate', e.target.value)}
                style={verification.overridden ? { borderColor: '#C2630A', textDecoration: 'line-through', color: '#6B7570' } : undefined}>
                <option value="">—</option>
                {[...GOVERNORATES].sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang)).map((g) => <option key={g.id} value={g.name.en}>{g.name[lang]}</option>)}
              </select>
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-soil">{t(lang, 'soilType')}</label>
              <select id="fw-soil" className="fw-in" value={farm.soil} onChange={(e) => set('soil', e.target.value as FarmInput['soil'])}>
                {TEXTURES.map((x) => <option key={x} value={x}>{t(lang, x)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fw-lbl" htmlFor="fw-ph">{t(lang, 'soilPh')}</label>
                <input id="fw-ph" className="fw-in font-mono" dir="ltr" inputMode="decimal" value={Number.isFinite(farm.ph) ? farm.ph : ''} onChange={(e) => set('ph', num(e.target.value))} />
              </div>
              <div>
                <label className="fw-lbl" htmlFor="fw-om">{t(lang, 'om')}</label>
                <input id="fw-om" className="fw-in font-mono" dir="ltr" inputMode="decimal" value={Number.isFinite(farm.organicMatter) ? farm.organicMatter : ''} onChange={(e) => set('organicMatter', num(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-ece">{t(lang, 'ece')}</label>
              <input id="fw-ece" className="fw-in font-mono" dir="ltr" inputMode="decimal" placeholder={t(lang, 'eceEmpty')} value={farm.ece ?? ''}
                onChange={(e) => set('ece', e.target.value.trim() === '' ? null : Number(e.target.value))} />
            </div>
            <label className="flex min-h-[44px] items-center gap-2 self-end text-sm">
              <input type="checkbox" className="h-4 w-4 accent-green" checked={farm.sodic} onChange={(e) => set('sodic', e.target.checked)} />
              {t(lang, 'sodic')}
            </label>
            <div>
              <label className="fw-lbl" htmlFor="fw-irr">{t(lang, 'irrigation')}</label>
              <select id="fw-irr" className="fw-in" value={farm.irrigation} onChange={(e) => set('irrigation', e.target.value as Irrigation)}>
                {IRRIGATIONS.map((x) => <option key={x} value={x}>{t(lang, 'irrOpt', { name: t(lang, x), eff: Math.round(IRRIGATION_EFFICIENCY[x] * 100) })}</option>)}
              </select>
            </div>
            <div>
              <label className="fw-lbl" htmlFor="fw-ws">{t(lang, 'waterSecurity')}</label>
              <select id="fw-ws" className="fw-in" value={farm.water} onChange={(e) => set('water', e.target.value as Level)}>
                {LEVELS.map((x) => <option key={x} value={x}>{t(lang, WS_KEY[x])}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="fw-lbl" htmlFor="fw-cap">{t(lang, 'capital')}</label>
              <select id="fw-cap" className="fw-in" value={farm.capital} onChange={(e) => set('capital', e.target.value as Level)}>
                {LEVELS.map((x) => <option key={x} value={x}>{t(lang, x)}</option>)}
              </select>
            </div>
            <fieldset className="m-0 rounded-[10px] border border-line px-4 pb-4 pt-3.5 sm:col-span-2">
              <legend className="px-1.5 text-[13px] font-semibold">{t(lang, 'currentRotation')}</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fw-lbl" htmlFor="fw-cur-w">{t(lang, 'currentWinter')}</label>
                  <select id="fw-cur-w" className="fw-in" value={current.winter} onChange={(e) => onCurrent({ ...current, winter: e.target.value })}>
                    {winterCrops.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fw-lbl" htmlFor="fw-cur-s">{t(lang, 'currentSummer')}</label>
                  <select id="fw-cur-s" className="fw-in" value={current.summer} onChange={(e) => onCurrent({ ...current, summer: e.target.value })}>
                    {summerCrops.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
                  </select>
                </div>
              </div>
              <p className="mt-2.5 text-xs leading-normal text-muted">{t(lang, 'currentHint')}</p>
            </fieldset>
          </div>
        </section>
      </div>

      <section className="mt-6" aria-label={t(lang, 'verifTitle')}>
        <h2 className="fw-h2 mb-3 text-lg">{t(lang, 'verifTitle')}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
          {checks.map((c, i) => {
            const s = STATUS_STYLE[c.status];
            return (
              <div key={i} className="rounded-xl border px-[18px] py-4" style={{ background: s.bg, borderColor: s.line }}>
                <div className="flex items-center gap-2.5 text-[15px] font-semibold" style={{ color: s.head }}>
                  <StatusBadge status={c.status} lang={lang} />{c.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: s.body }}>{c.body}</p>
                {c.action && (
                  <button type="button" className="fw-btn fw-btn-sm mt-3 border-blue bg-blue font-semibold text-white" onClick={c.action.run}>{c.action.label}</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && <p role="alert" className="mt-4 rounded-lg border border-red-line bg-red-tint p-3 text-red">{error}</p>}
      <div className="fw-foot no-print">
        <span className="text-[13px] text-muted">NASA POWER · 0.5° · 2001–2020</span>
        <button type="button" className="fw-btn fw-pri" onClick={onAnalyze} disabled={busy}>
          {busy ? t(lang, 'fetching') : t(lang, 'toClimate')}<ArrowIcon />
        </button>
      </div>
    </main>
  );
}

function buildChecks(lang: Lang, farm: FarmInput, v: Verification, ds: CropDataset, setGov: (name: string) => void): Check[] {
  const out: Check[] = [];
  const gov = v.governorate;
  const statusFor = (n: Note): Status =>
    n.key === 'geo.override' || n.key === 'geo.unverified' ? 'synced' : n.level === 'risk' ? 'fail' : n.level === 'warn' ? 'watch' : 'pass';
  for (const n of v.notes) {
    out.push({
      status: statusFor(n), title: t(lang, `vt.${n.key}`), body: renderNote(n, lang, ds),
      action: n.key === 'geo.override' && gov && farm.governorate !== gov.name.en
        ? { label: t(lang, 'useGov', { gov: gov.name[lang] }), run: () => setGov(gov.name.en) } : undefined,
    });
  }
  const soilConflict = v.notes.some((n) => n.key === 'geo.soilClayInSand' || n.key === 'geo.soilSandInDelta');
  if (gov && !soilConflict) out.push({ status: 'pass', title: t(lang, 'vt.soilOk'), body: t(lang, 'soilOk', { soil: t(lang, farm.soil), gov: gov.name[lang] }) });
  if (Number.isFinite(farm.ph)) {
    const ph = soilAmendments(farm, false)[0];
    out.push({ status: ph.key === 'amend.lime' ? 'pass' : 'watch', title: t(lang, `vt.${ph.key}`), body: renderNote(ph, lang, ds) });
  }
  return out;
}
