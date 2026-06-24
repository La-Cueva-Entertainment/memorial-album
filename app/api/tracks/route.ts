import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import { db } from '@/lib/db';
import { TRACKS_DIR, isValidAudioBuffer } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import fs from 'fs';
import path from 'path';

/** GET /api/tracks — public, returns ordered track list */
export async function GET() {
  const tracks = await db.track.findMany({ orderBy: { ts: 'asc' } });
  return NextResponse.json(tracks);
}

/** POST /api/tracks — admin only, multipart with `file` */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!rateLimit(getClientIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buf = Buffer.from(bytes);

  // Audio files (FLAC, ALAC etc.) can be large — allow up to 200 MB
  if (buf.length > 200 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 200 MB)' }, { status: 413 });
  }
  if (!isValidAudioBuffer(buf)) {
    return NextResponse.json({ error: 'Invalid audio format' }, { status: 400 });
  }

  // Read ID3 / Vorbis / FLAC metadata for title + artist
  let title = (formData.get('title') as string | null)?.trim() || '';
  try {
    const { parseBuffer } = await import('music-metadata');
    const meta = await parseBuffer(buf, { mimeType: file.type || undefined });
    const t = meta.common.title?.trim();
    const a = meta.common.artist?.trim();
    if (!title) {
      title = t
        ? (a ? `${t} — ${a}` : t)
        : file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    }
  } catch {
    if (!title) title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  const ext = (file.name.split('.').pop() ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  fs.mkdirSync(TRACKS_DIR, { recursive: true });
  fs.writeFileSync(path.join(TRACKS_DIR, filename), buf);

  const track = await db.track.create({ data: { title, filename } });
  return NextResponse.json(track, { status: 201 });
}