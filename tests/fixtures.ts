import type { ClimateProfile, FarmInput } from '../src/lib/types';

const T = [14, 14.5, 16.5, 19.5, 23, 26, 27.5, 28, 26.5, 23.5, 19.5, 15.5];
const P = [1.2, 0.8, 0.5, 0.15, 0.05, 0, 0, 0, 0.02, 0.3, 0.7, 1.1];

/** Synthetic north-Delta-like climatology. Test fixture only, not observed data. */
export const deltaClimate: ClimateProfile = {
  lat: 31.1, lng: 30.9, kind: 'climatology', period: 'fixture', resolution: 'fixture', source: 'test',
  months: T.map((t, i) => ({ t2m: t, tmax: t + 6, tmin: t - 6, precMmDay: P[i], rh: 65, radMJ: 18 })),
};

export const farm = (over: Partial<FarmInput> = {}): FarmInput => ({
  name: 'Test', lat: 31.1, lng: 30.9, area: 10, areaUnit: 'feddan', governorate: 'Kafr El Sheikh', country: 'Egypt',
  soil: 'clay_loam', ph: 7.9, organicMatter: 1.2, ece: null, sodic: false, irrigation: 'surface', water: 'medium', capital: 'medium',
  ...over,
});
