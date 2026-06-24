import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

type ImmichAsset = { id: string; type?: string; originalFileName?: string };

function isImage(a: ImmichAsset) {
  return !a.type || a.type.toUpperCase() === 'IMAGE';
}

async function fetchAssets(serverUrl: string, apiKey: string, albumId?: string): Promise<ImmichAsset[]> {
  // If an album is specified, fetch just that album's assets
  if (albumId && /^[a-zA-Z0-9_-]+$/.test(albumId)) {
    try {
      const res = await fetch(`${serverUrl}/api/albums/${albumId}`, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json() as { assets?: ImmichAsset[] };
        if (Array.isArray(data.assets)) return data.assets.filter(isImage);
      }
    } catch { /* fall through */ }
  }

  // Strategy 1: GET /api/assets with new pagination
  for (const qs of ['?page=1&size=1000', '?take=1000&skip=0']) {
    try {
      const res = await fetch(`${serverUrl}/api/assets${qs}`, {
        headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const arr: ImmichAsset[] = Array.isArray(data) ? data : (data.assets ?? []);
        return arr.filter(isImage);
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: POST /api/search/metadata (Immich 1.94+)
  try {
    const res = await fetch(`${serverUrl}/api/search/metadata`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ page: 1, size: 1000, type: 'IMAGE' }),
    });
    if (res.ok) {
      const data = await res.json() as { assets?: { items?: ImmichAsset[] } };
      return data.assets?.items ?? [];
    }
  } catch { /* fall through */ }

  throw new Error('Could not list assets — no compatible Immich endpoint found');
}

/**
 * GET /api/immich/browse
 * Returns photo assets + albums from Immich.
 * Also returns whether env vars are configured so the client can skip the connect form.
 */
export async function GET(req: NextRequest) {
  const envServerUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
  const envApiKey = process.env.IMMICH_API_KEY;

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const serverUrl = envServerUrl ?? session.immich?.serverUrl;
  const apiKey = envApiKey ?? session.immich?.apiKey;
  const configured = !!(envServerUrl && envApiKey);

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ configured: false, assets: [], albums: [] });
  }

  const filterAlbumId = new URL(req.url).searchParams.get('albumId')
    ?? process.env.IMMICH_ALBUM_ID
    ?? undefined;

  // Fetch assets (optionally filtered to album) and album list in parallel
  const [assetsResult, albumsResult] = await Promise.allSettled([
    fetchAssets(serverUrl, apiKey, filterAlbumId),
    fetch(`${serverUrl}/api/albums`, { headers: { 'x-api-key': apiKey, Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; albumName: string; assetCount?: number }>) =>
        data.map(a => ({ id: a.id, name: a.albumName, count: a.assetCount ?? 0 }))
      ),
  ]);

  const assets = assetsResult.status === 'fulfilled' ? assetsResult.value : [];
  const albums = albumsResult.status === 'fulfilled' ? albumsResult.value : [];
  const error = assetsResult.status === 'rejected'
    ? (assetsResult.reason instanceof Error ? assetsResult.reason.message : 'Failed to fetch photos')
    : undefined;

  return NextResponse.json({ configured, assets, albums, ...(error ? { error } : {}) },
    { status: error && !assets.length ? 502 : 200 }
  );
}
