import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** GET /api/site-config — returns all config as a flat { key: value } object */
export async function GET() {
  const rows = await db.siteConfig.findMany();
  const config = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json(config);
}

/** PATCH /api/site-config — upserts key/value pairs (admin only) */
export async function PATCH(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Record<string, string>;
  const allowedKeys = [
    'bio_hero_immich_id', 'bio_hero_img_path', 'bio_location',
    'event_date', 'event_time', 'event_where', 'event_venue',
    'event_dress', 'event_dress_note', 'event_bring', 'event_notes',
    'default_album_link',
  ];

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue;
    await db.siteConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return NextResponse.json({ ok: true });
}
