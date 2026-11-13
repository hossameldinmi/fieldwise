import type { FarmInput, Note } from '../types';
import { findGovernorateByName, findGovernorateByPoint, inEgypt, type Governorate } from './regions';

export interface GeocodeHit { country?: string; countryCode?: string; state?: string }

export interface Verification {
  governorate?: Governorate;
  country: string;
  method: 'reverse_geocode' | 'bbox' | 'none';
  overridden: boolean;
  notes: Note[];
}

/**
 * Cross-checks typed jurisdiction against GPS. GPS always wins; any override is surfaced.
 * `geocode` is the reverse-geocoder result (may be null when offline).
 */
export function verifyLocation(farm: FarmInput, geocode: GeocodeHit | null): Verification {
  const notes: Note[] = [];
  const typed = findGovernorateByName(farm.governorate);
  let country = farm.country.trim() || 'Egypt';

  if (geocode?.countryCode && geocode.countryCode.toLowerCase() !== 'eg') {
    if (geocode.country && geocode.country.toLowerCase() !== country.toLowerCase())
      notes.push({ key: 'geo.countryMismatch', params: { gps: geocode.country, typed: country }, level: 'warn', tier: 1 });
    notes.push({ key: 'geo.outside', level: 'info', tier: 2 });
    return { country: geocode.country ?? country, method: 'reverse_geocode', overridden: true, notes };
  }
  if (!geocode && !inEgypt(farm.lat, farm.lng)) {
    notes.push({ key: 'geo.outside', level: 'info', tier: 2 });
    return { country, method: 'none', overridden: false, notes };
  }
  country = 'Egypt';

  let gps: Governorate | undefined;
  let method: Verification['method'] = 'bbox';
  if (geocode?.state) {
    gps = findGovernorateByName(geocode.state);
    if (gps) method = 'reverse_geocode';
  }
  if (!gps) {
    gps = findGovernorateByPoint(farm.lat, farm.lng);
    notes.push({ key: 'geo.unverified', level: 'info', tier: 2 });
  }
  if (!gps) {
    notes.push({ key: 'geo.outside', level: 'info', tier: 2 });
    return { country, method: 'none', overridden: false, notes };
  }

  const overridden = !!farm.governorate.trim() && typed?.id !== gps.id;
  notes.push(
    overridden
      ? { key: 'geo.override', params: { gps: gps.id, typed: farm.governorate }, level: 'warn', tier: 1 }
      : { key: 'geo.match', params: { gov: gps.id }, level: 'info', tier: 1 },
  );

  const sandy = farm.soil === 'sand' || farm.soil === 'loamy_sand';
  const heavy = farm.soil === 'clay' || farm.soil === 'clay_loam';
  if (gps.zone === 'desert_reclaimed' && heavy)
    notes.push({ key: 'geo.soilClayInSand', params: { gov: gps.id }, level: 'warn', tier: 2 });
  if ((gps.zone === 'delta_alluvial' || gps.zone === 'valley_alluvial') && sandy)
    notes.push({ key: 'geo.soilSandInDelta', params: { gov: gps.id }, level: 'warn', tier: 2 });
  if (gps.salinityRisk) notes.push({ key: 'geo.salinity', params: { gov: gps.id }, level: 'warn', tier: 3 });

  return { governorate: gps, country, method, overridden, notes };
}
