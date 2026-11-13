import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Reverse geocoding via OpenStreetMap Nominatim (usage policy: ≤1 req/s, identifying User-Agent, caching).
 * Returns null fields on failure so the client falls back to offline governorate boxes.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&accept-language=en&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT ?? 'FieldWise-ADSS/0.1 (set NOMINATIM_USER_AGENT)' },
      next: { revalidate: 604800 }, signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json(null);
    const j = await res.json();
    return NextResponse.json({ country: j.address?.country, countryCode: j.address?.country_code, state: j.address?.state });
  } catch {
    return NextResponse.json(null);
  }
}
