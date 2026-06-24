import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/**
 * GET /api/immich/asset?assetId=xxx
 * Proxies the full asset info from Immich, including exifInfo (city, state, country, lat/lng).
 * Admin-only since it exposes raw Immich metadata.
 */
export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '') ?? session.immich?.serverUrl;
  const apiKey = process.env.IMMICH_API_KEY ?? session.immich?.apiKey;

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ error: 'Immich not configured' }, { status: 503 });
  }

  const assetId = new URL(req.url).searchParams.get('assetId');
  if (!assetId || !/^[a-zA-Z0-9_-]+$/.test(assetId)) {
    return NextResponse.json({ error: 'Invalid assetId' }, { status: 400 });
  }

  try {
    const res = await fetch(`${serverUrl}/api/assets/${assetId}`, {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
    });
    if (!res.ok) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const data = await res.json() as { exifInfo?: { city?: string; state?: string; country?: string; latitude?: number; longitude?: number } };
    return NextResponse.json({ exifInfo: data.exifInfo ?? null });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 502 });
  }
}
