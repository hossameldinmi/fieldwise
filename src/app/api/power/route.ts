import { NextResponse } from 'next/server';
import { climatologyUrl, parseClimatology } from '@/lib/nasa/power';

export const runtime = 'nodejs';

/** Proxies NASA POWER climatology (server-side: avoids CORS, enables 24 h caching). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  try {
    const res = await fetch(climatologyUrl(lat, lng), { next: { revalidate: 86400 }, signal: AbortSignal.timeout(25000) });
    if (!res.ok) return NextResponse.json({ error: `NASA POWER HTTP ${res.status}` }, { status: 502 });
    return NextResponse.json(parseClimatology(await res.json(), lat, lng));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'NASA POWER request failed' }, { status: 502 });
  }
}
