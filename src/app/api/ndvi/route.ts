import { NextResponse } from 'next/server';
import { datesUrl, parseSubsets, requestWindows, subsetUrl, summarizeNdvi } from '@/lib/nasa/modis';

export const runtime = 'nodejs';
const WEEK = 7 * 86400;

/** Proxies the ORNL DAAC MODIS Web Service: last ~3 years of MOD13Q1 NDVI at a point, cached for a week. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  const get = async (url: string) => {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: WEEK }, signal: AbortSignal.timeout(45000) });
    if (!res.ok) throw new Error(`MODIS web service HTTP ${res.status}`);
    return res.json();
  };
  try {
    const windows = requestWindows(await get(datesUrl(lat, lng)));
    if (!windows.length) return NextResponse.json({ error: 'No MODIS composites for this location' }, { status: 404 });
    const parts = await Promise.all(windows.map(([a, b]) => get(subsetUrl(lat, lng, a, b))));
    const series = parseSubsets(parts);
    if (!series.length) return NextResponse.json({ error: 'MODIS returned no valid NDVI values' }, { status: 502 });
    return NextResponse.json(summarizeNdvi(series, lat, lng));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'MODIS request failed' }, { status: 502 });
  }
}
