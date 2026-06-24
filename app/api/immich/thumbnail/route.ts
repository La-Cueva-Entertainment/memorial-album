import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/**
 * GET /api/immich/thumbnail?assetId=xxx
 * Proxies a thumbnail from the user's Immich server using credentials stored in session.
 * Credentials are never exposed in URLs from the client side.
 */
export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const serverUrl = process.env.IMMICH_SERVER_URL?.replace(/\/$/, '') ?? session.immich?.serverUrl;
  const apiKey = process.env.IMMICH_API_KEY ?? session.immich?.apiKey;

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ error: 'Not connected to Immich' }, { status: 401 });
  }

  const assetId = new URL(req.url).searchParams.get('assetId');
  if (!assetId || !/^[a-zA-Z0-9_-]+$/.test(assetId)) {
    return NextResponse.json({ error: 'Invalid assetId' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${serverUrl}/api/assets/${assetId}/thumbnail?size=preview`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 });

    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch thumbnail' }, { status: 502 });
  }
}
