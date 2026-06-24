import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const serverUrl = (process.env.IMMICH_SERVER_URL?.replace(/\/$/, '')) ?? session.immich?.serverUrl;
  const apiKey = process.env.IMMICH_API_KEY ?? session.immich?.apiKey;

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ error: 'Not connected to Immich' }, { status: 401 });
  }

  const body = await req.json() as { assetIds?: string[]; author?: string; targetAlbumId?: string; source?: string; caption?: string };
  const assetIds = (body.assetIds ?? []).filter(id => /^[a-zA-Z0-9_-]+$/.test(id));
  if (!assetIds.length) return NextResponse.json({ error: 'No assetIds provided' }, { status: 400 });

  const author = body.author?.trim() || 'anonymous';
  const source = body.source === 'board' ? 'board' : 'gallery';
  const caption = body.caption?.trim() ?? '';

  const albumId = (body.targetAlbumId && /^[a-zA-Z0-9_-]+$/.test(body.targetAlbumId))
    ? body.targetAlbumId
    : process.env.IMMICH_ALBUM_ID;
  if (albumId && /^[a-zA-Z0-9_-]+$/.test(albumId)) {
    await fetch(`${serverUrl}/api/albums/${albumId}/assets`, {
      method: 'PUT',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: assetIds }),
    }).catch(() => {});
  }

  const created = [];
  const agg = await db.item.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (agg._max.sortOrder ?? 0) + 1;

  for (const assetId of assetIds) {
    const item = await db.item.create({
      data: { imgPath: `immich:${assetId}`, caption, author, source, sortOrder },
      include: { comments: true },
    });
    created.push(item);
    sortOrder++;
  }

  return NextResponse.json(created, { status: 201 });
}
