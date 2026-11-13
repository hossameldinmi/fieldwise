'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ClimateProfile, CropDataset, FarmInput, Lang } from '@/lib/types';
import { DEFAULT_DATASET } from '@/lib/crops/default';
import { evaluateAll, type Report } from '@/lib/engine/evaluate';
import { farmStrategies, type CurrentRotation, type StrategyId } from '@/lib/engine/strategies';
import { verifyLocation, type GeocodeHit } from '@/lib/geo/verify';
import { t } from '@/lib/i18n';
import { AppHeader, type Step } from '@/components/AppHeader';
import { StepFarm } from '@/components/StepFarm';
import { StepClimate } from '@/components/StepClimate';
import { StepRotations } from '@/components/StepRotations';
import { StepReport } from '@/components/StepReport';
import { StepDatabase } from '@/components/StepDatabase';
import type { NdviState } from '@/components/NdviPanel';

const INITIAL: FarmInput = {
  name: 'Sakha demonstration field', lat: 31.0964, lng: 30.9426, area: 12, areaUnit: 'feddan',
  governorate: 'Kafr El Sheikh', country: 'Egypt', soil: 'clay_loam', ph: 7.9, organicMatter: 1.3, ece: null, sodic: false,
  irrigation: 'surface', water: 'medium', capital: 'medium',
};
/** Coordinates further apart than this (degrees) mean the fetched climate belongs to another place. */
const STALE_DEG = 0.01;

/** Keeps a crop id valid for its season after a new dataset is loaded. */
function validCrop(ds: CropDataset, id: string, season: 'winter' | 'summer') {
  return ds.crops.some((c) => c.id === id && c.season === season) ? id : ds.crops.find((c) => c.season === season)?.id ?? id;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<Step>(1);
  const [farm, setFarm] = useState<FarmInput>(INITIAL);
  const [current, setCurrent] = useState<CurrentRotation>({ winter: 'wheat', summer: 'maize' });
  const [custom, setCustom] = useState<string[]>(['faba_bean', 'maize', 'wheat', 'soybean']);
  const [selected, setSelected] = useState<StrategyId | null>(null);
  const [dataset, setDataset] = useState<CropDataset>(DEFAULT_DATASET);
  const [climate, setClimate] = useState<ClimateProfile | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number; hit: GeocodeHit | null } | null>(null);
  const [ndvi, setNdvi] = useState<{ lat: number; lng: number; state: NdviState } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);

  // The reverse-geocode result only counts while the pin stays where it was looked up.
  const verification = useMemo(
    () => verifyLocation(farm, geo && geo.lat === farm.lat && geo.lng === farm.lng ? geo.hit : null),
    [farm, geo],
  );

  const strategies = useMemo(() => {
    const cur = { winter: validCrop(dataset, current.winter, 'winter'), summer: validCrop(dataset, current.summer, 'summer') };
    const cus = custom.map((id, i) => validCrop(dataset, id, i % 2 === 0 ? 'winter' : 'summer'));
    return farmStrategies(cur, cus);
  }, [dataset, current, custom]);

  // Deterministic: the report recomputes instantly from inputs + cached climate.
  const report: Report | null = useMemo(() => {
    if (!climate) return null;
    try { return evaluateAll(farm, climate, dataset, !!verification.governorate?.salinityRisk, strategies); }
    catch { return null; }
  }, [farm, climate, dataset, verification, strategies]);

  const stale = !!climate && (Math.abs(climate.lat - farm.lat) > STALE_DEG || Math.abs(climate.lng - farm.lng) > STALE_DEG);
  const best = report ? [...report.results].sort((a, b) => b.total - a.total)[0].id : 'A';

  async function analyze() {
    if (![farm.lat, farm.lng].every(Number.isFinite)) { setError(t(lang, 'errorCoords')); return; }
    setBusy(true); setError(null);
    loadNdvi(farm.lat, farm.lng);
    try {
      const [powerRes, hit] = await Promise.all([
        fetch(`/api/power?lat=${farm.lat}&lng=${farm.lng}`),
        fetch(`/api/geocode?lat=${farm.lat}&lng=${farm.lng}`).then((r) => (r.ok ? r.json() : null)).catch(() => null) as Promise<GeocodeHit | null>,
      ]);
      const body = await powerRes.json();
      if (!powerRes.ok) throw new Error(body.error ?? `HTTP ${powerRes.status}`);
      setGeo({ lat: farm.lat, lng: farm.lng, hit });
      const v = verifyLocation(farm, hit);
      if (v.governorate && v.overridden) setFarm((f) => ({ ...f, governorate: v.governorate!.name.en, country: v.country }));
      setClimate(body as ClimateProfile);
      setStep(2);
    } catch (e) {
      setError(t(lang, 'errorPower', { msg: e instanceof Error ? e.message : String(e) }));
    } finally { setBusy(false); }
  }

  /** MODIS NDVI is supplementary: it loads in the background and never blocks scoring. */
  function loadNdvi(lat: number, lng: number) {
    if (ndvi && ndvi.lat === lat && ndvi.lng === lng && ndvi.state.status !== 'error') return;
    setNdvi({ lat, lng, state: { status: 'loading' } });
    fetch(`/api/ndvi?lat=${lat}&lng=${lng}`)
      .then(async (r) => { const b = await r.json(); if (!r.ok) throw new Error(b.error ?? `HTTP ${r.status}`); return b; })
      .then((data) => setNdvi((cur) => (cur && cur.lat === lat && cur.lng === lng ? { lat, lng, state: { status: 'ok', data } } : cur)))
      .catch((e) => setNdvi((cur) => (cur && cur.lat === lat && cur.lng === lng ? { lat, lng, state: { status: 'error', message: e instanceof Error ? e.message : String(e) } } : cur)));
  }
  const ndviState = ndvi && ndvi.lat === farm.lat && ndvi.lng === farm.lng ? ndvi.state : null;

  return (
    <>
      <AppHeader lang={lang} step={step} canAnalyze={!!report} onStep={setStep} onLang={setLang} />
      {step === 1 && (
        <StepFarm lang={lang} farm={farm} onFarm={setFarm} current={current} onCurrent={setCurrent} dataset={dataset}
          verification={verification} busy={busy} error={error} onAnalyze={analyze} />
      )}
      {step === 2 && report && climate && (
        <StepClimate lang={lang} climate={climate} report={report} farm={farm} dataset={dataset} ndvi={ndviState} stale={stale} onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {step === 3 && report && (
        <StepRotations lang={lang} report={report} dataset={dataset} selected={selected ?? best} onSelect={setSelected}
          custom={custom} onCustom={setCustom} onBack={() => setStep(2)} onNext={() => setStep(4)} />
      )}
      {step === 4 && report && (
        <StepReport lang={lang} report={report} dataset={dataset} farm={farm} ndvi={ndviState?.status === 'ok' ? ndviState.data : null} onBack={() => setStep(3)} onRestart={() => setStep(1)} />
      )}
      {step === 5 && <StepDatabase lang={lang} dataset={dataset} onLoad={setDataset} />}
    </>
  );
}
