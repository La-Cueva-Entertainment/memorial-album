import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Module-level cache so Apple's bot gets a fast response on the second hit
// (first request generates the PNG; subsequent requests return from cache).
// Stored as ArrayBuffer — NextResponse accepts it natively (Buffer is not in BodyInit).
let _cachedPng: ArrayBuffer | null = null;
let _cacheExpiresAt = 0;

export async function GET(_req: NextRequest) {
  // Serve from in-memory cache when available
  const now = Date.now();
  if (_cachedPng && now < _cacheExpiresAt) {
    return new NextResponse(_cachedPng, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  }

  // Fetch portrait directly from Immich server-to-server.
  // Hard timeout of 3 s so Apple's bot (short deadline) never hangs.
  let portraitDataUrl: string | null = null;
  try {
    const portraitConfig = await db.siteConfig.findUnique({ where: { key: 'bio_hero_img_path' } });
    if (portraitConfig?.value?.startsWith('immich:')) {
      const assetId = portraitConfig.value.slice(7);
      const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '');
      const apiKey = process.env.IMMICH_API_KEY;
      if (serverUrl && apiKey) {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 3000);
        try {
          const res = await fetch(
            `${serverUrl}/api/assets/${assetId}/thumbnail?size=preview`,
            { headers: { 'x-api-key': apiKey }, cache: 'no-store', signal: ac.signal },
          );
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const ct = res.headers.get('Content-Type') ?? 'image/jpeg';
            portraitDataUrl = `data:${ct};base64,${buf.toString('base64')}`;
          }
        } finally {
          clearTimeout(timer);
        }
      }
    }
  } catch {
    // Immich unavailable or timed out — fall through to text-only card
  }

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#1a1a1a',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {portraitDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitDataUrl}
            width={1200}
            height={630}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Fallback when no portrait is set — plain warm background */
          <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f7f2e9' }} />
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );

  // Store in module-level cache (1 hour)
  const pngBuffer = await imageResponse.arrayBuffer();
  _cachedPng = pngBuffer;
  _cacheExpiresAt = Date.now() + 3_600_000;

  return new NextResponse(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
