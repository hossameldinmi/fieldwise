'use client';
import dynamic from 'next/dynamic';
import type { AreaUnit, FarmInput, Lang, Level, Irrigation, Texture } from '@/lib/types';
import { TEXTURES } from '@/lib/types';
import { t } from '@/lib/i18n';
import { convertArea } from '@/lib/units';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-md bg-line" /> });

interface Props { farm: FarmInput; lang: Lang; onChange: (f: FarmInput) => void }

const field = 'block w-full rounded-md border border-line bg-white px-3 py-2 text-[15px] text-silt focus:outline-none focus-visible:ring-2 focus-visible:ring-berseem';
const label = 'mb-1 block text-sm font-medium text-siltSoft';

export function FarmForm({ farm, lang, onChange }: Props) {
  const set = <K extends keyof FarmInput>(k: K, v: FarmInput[K]) => onChange({ ...farm, [k]: v });
  const num = (v: string) => (v === '' ? NaN : Number(v));
  const ha = convertArea(farm.area || 0, farm.areaUnit, 'hectare');
  const fd = convertArea(farm.area || 0, farm.areaUnit, 'feddan');

  const select = <T extends string>(k: keyof FarmInput, opts: readonly T[], value: T) => (
    <select id={k} className={field} value={value} onChange={(e) => set(k, e.target.value as never)}>
      {opts.map((o) => <option key={o} value={o}>{t(lang, o)}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className={label}>{t(lang, 'farmName')}</label>
        <input id="name" className={field} value={farm.name} onChange={(e) => set('name', e.target.value)} />
      </div>

      <fieldset className="space-y-2">
        <legend className={label}>{t(lang, 'location')}</legend>
        <MapPicker lat={farm.lat} lng={farm.lng} onPick={(lat, lng) => onChange({ ...farm, lat, lng })} />
        <p className="text-sm text-siltSoft">{t(lang, 'mapHint')}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="lat" className="sr-only">{t(lang, 'latitude')}</label>
            <input id="lat" dir="ltr" inputMode="decimal" className={field} placeholder={t(lang, 'latitude')} value={Number.isFinite(farm.lat) ? farm.lat : ''} onChange={(e) => set('lat', num(e.target.value))} />
          </div>
          <div>
            <label htmlFor="lng" className="sr-only">{t(lang, 'longitude')}</label>
            <input id="lng" dir="ltr" inputMode="decimal" className={field} placeholder={t(lang, 'longitude')} value={Number.isFinite(farm.lng) ? farm.lng : ''} onChange={(e) => set('lng', num(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="governorate" className={label}>{t(lang, 'governorate')}</label>
            <input id="governorate" className={field} value={farm.governorate} onChange={(e) => set('governorate', e.target.value)} />
          </div>
          <div>
            <label htmlFor="country" className={label}>{t(lang, 'country')}</label>
            <input id="country" className={field} value={farm.country} onChange={(e) => set('country', e.target.value)} />
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="area" className={label}>{t(lang, 'area')}</label>
        <div className="flex gap-2">
          <input id="area" dir="ltr" inputMode="decimal" className={field} value={Number.isFinite(farm.area) ? farm.area : ''} onChange={(e) => set('area', num(e.target.value))} />
          <select aria-label={t(lang, 'area')} className={`${field} w-36`} value={farm.areaUnit}
            onChange={(e) => {
              const unit = e.target.value as AreaUnit;
              onChange({ ...farm, areaUnit: unit, area: Number(convertArea(farm.area || 0, farm.areaUnit, unit).toFixed(3)) });
            }}>
            {(['feddan', 'hectare', 'acre'] as const).map((u) => <option key={u} value={u}>{t(lang, u)}</option>)}
          </select>
        </div>
        <p className="mt-1 text-sm tabular-nums text-siltSoft">{t(lang, 'equals', { ha: ha.toFixed(2), fd: fd.toFixed(2) })}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="soil" className={label}>{t(lang, 'soilType')}</label>
          {select<Texture>('soil', TEXTURES, farm.soil)}
        </div>
        <div>
          <label htmlFor="ph" className={label}>{t(lang, 'soilPh')}</label>
          <input id="ph" dir="ltr" inputMode="decimal" className={field} value={Number.isFinite(farm.ph) ? farm.ph : ''} onChange={(e) => set('ph', num(e.target.value))} />
        </div>
        <div>
          <label htmlFor="om" className={label}>{t(lang, 'om')}</label>
          <input id="om" dir="ltr" inputMode="decimal" className={field} value={Number.isFinite(farm.organicMatter) ? farm.organicMatter : ''} onChange={(e) => set('organicMatter', num(e.target.value))} />
        </div>
        <div>
          <label htmlFor="ece" className={label}>{t(lang, 'ece')}</label>
          <input id="ece" dir="ltr" inputMode="decimal" placeholder={t(lang, 'eceHint')} className={field} value={farm.ece ?? ''}
            onChange={(e) => set('ece', e.target.value === '' ? null : Number(e.target.value))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[15px]">
        <input type="checkbox" className="h-4 w-4 accent-berseem" checked={farm.sodic} onChange={(e) => set('sodic', e.target.checked)} />
        {t(lang, 'sodic')}
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        <div>
          <label htmlFor="irrigation" className={label}>{t(lang, 'irrigation')}</label>
          {select<Irrigation>('irrigation', ['drip', 'sprinkler', 'surface', 'canal_flood'], farm.irrigation)}
        </div>
        <div>
          <label htmlFor="water" className={label}>{t(lang, 'waterSecurity')}</label>
          {select<Level>('water', ['low', 'medium', 'high'], farm.water)}
        </div>
        <div>
          <label htmlFor="capital" className={label}>{t(lang, 'capital')}</label>
          {select<Level>('capital', ['low', 'medium', 'high'], farm.capital)}
        </div>
      </div>
    </div>
  );
}
