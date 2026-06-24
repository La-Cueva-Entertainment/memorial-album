import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/**
 * GET /api/immich/video?assetId=xxx
 * Streams a video file from the Immich server.
 * Supports Range requests for <video> seek support.
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

  const rangeHeader = req.headers.get('range') ?? undefined;

  try {
    const upstream = await fetch(
      `${serverUrl}/api/assets/${assetId}/video/playback`,
      {
        headers: {
          'x-api-key': apiKey,
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        },
      }
    );

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: 'Video not found' }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'video/mp4';
    const contentLength = upstream.headers.get('Content-Length');
    const contentRange = upstream.headers.get('Content-Range');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
      'Accept-Ranges': 'bytes',
    };
    if (contentLength) headers['Content-Length'] = contentLength;
    if (contentRange) headers['Content-Range'] = contentRange;

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 });
  }
}
