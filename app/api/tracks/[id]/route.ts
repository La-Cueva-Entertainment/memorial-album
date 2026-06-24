import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import { db } from '@/lib/db';
import { TRACKS_DIR } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/tracks/[id] — admin only */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const track = await db.track.findUnique({ where: { id } });
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const filePath = path.join(TRACKS_DIR, track.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await db.track.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
