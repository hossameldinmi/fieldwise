'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ClimateProfile, CropDataset, FarmInput, Lang, Note } from '@/lib/types';
import { DEFAULT_DATASET } from '@/lib/crops/default';
import { evaluateAll, type Report as ReportData } from '@/lib/engine/evaluate';
import { verifyLocation, type GeocodeHit } from '@/lib/geo/verify';
import { GOVERNORATES } from '@/lib/geo/regions';
import { t } from '@/lib/i18n';
import { FarmForm } from '@/components/FarmForm';
import { DatasetPanel } from '@/components/DatasetPanel';
import { Report } from '@/components/Report';

const INITIAL: FarmInput = {
  name: 'Sakha demonstration field', lat: 31.0964, lng: 30.9426, area: 12, areaUnit: 'feddan',
  governorate: 'Kafr El Sheikh', country: 'Egypt', soil: 'clay_loam', ph: 7.9, organicMatter: 1.3, ece: null, sodic: false,
  irrigation: 'surface', water: 'medium', capital: 'medium',
};

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [farm, setFarm] = useState<FarmInput>(INITIAL);
  const [dataset, setDataset] = useState<CropDataset>(DEFAULT_DATASET);
  const [climate, setClimate] = useState<ClimateProfile | null>(null);
  const [verification, setVerification] = useState<Note[]>([]);
  const [salinityZone, setSalinityZone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Deterministic: the report recomputes instantly from inputs + cached climate.
  const report: ReportData | null = useMemo(
    () => (climate ? evaluateAll(farm, climate, dataset, salinityZone) : null),
    [farm, climate, dataset, salinityZone],
  );

  async function analyze() {
    if (![farm.lat, farm.lng].every(Number.isFinite)) { setError(t(lang, 'errorCoords')); return; }
    setBusy(true); setError(null);
    try {
      const [powerRes, geo] = await Promise.all([
        fetch(`/api/power?lat=${farm.lat}&lng=${farm.lng}`),
        fetch(`/api/geocode?lat=${farm.lat}&lng=${farm.lng}`).then((r) => (r.ok ? r.json() : null)).catch(() => null) as Promise<GeocodeHit | null>,
      ]);
      const body = await powerRes.json();
      if (!powerRes.ok) throw new Error(body.error ?? `HTTP ${powerRes.status}`);
      const v = verifyLocation(farm, geo);
      setVerification(v.notes);
      setSalinityZone(!!v.governorate?.salinityRisk);
      if (v.governorate && v.overridden) setFarm((f) => ({ ...f, governorate: v.governorate!.name[lang], country: v.country }));
      setClimate(body as ClimateProfile);
    } catch (e) {
      setClimate(null);
      setError(t(lang, 'errorPower', { msg: e instanceof Error ? e.message : String(e) }));
    } finally { setBusy(false); }
  }

  const switchLang = () => {
    const next: Lang = lang === 'en' ? 'ar' : 'en';
    const gov = GOVERNORATES.find((g) => g.name[lang] === farm.governorate);
    if (gov) setFarm((f) => ({ ...f, governorate: gov.name[next] }));
    setLang(next);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-10">
      <header className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-berseem sm:text-5xl">{t(lang, 'appTitle')}</h1>
          <p className="mt-2 max-w-[60ch] text-lg text-siltSoft">{t(lang, 'appTagline')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={switchLang} className="rounded-md border border-line bg-white px-4 py-2 font-medium hover:border-berseem">{t(lang, 'language')}</button>
          {report && <button type="button" onClick={() => window.print()} className="rounded-md border border-line bg-white px-4 py-2 font-medium hover:border-berseem">{t(lang, 'print')}</button>}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="no-print space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pe-2">
          <FarmForm farm={farm} lang={lang} onChange={setFarm} />
          <button type="button" onClick={analyze} disabled={busy}
            className="w-full rounded-md bg-berseem px-4 py-3 text-lg font-semibold text-white hover:bg-[#25582F] disabled:cursor-wait disabled:opacity-70">
            {busy ? t(lang, 'running') : t(lang, 'run')}
          </button>
          {error && <p role="alert" className="rounded-md border border-blight bg-white p-3 text-blight">{error}</p>}
          <DatasetPanel dataset={dataset} lang={lang} onLoad={setDataset} />
        </aside>

        <div className="print-full min-w-0" aria-live="polite">
          {report && climate ? (
            <Report report={report} climate={climate} verification={verification} lang={lang} ds={dataset} farmName={farm.name} />
          ) : (
            <p className="max-w-[55ch] border-s-4 border-berseem ps-4 text-xl leading-relaxed text-siltSoft">{t(lang, 'emptyReport')}</p>
          )}
        </div>
      </div>
    </main>
  );
}
