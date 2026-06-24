import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from '@/lib/storage';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/items/[id] — update tilt/order (admin) or caption/author (owner or admin) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const { id } = await params;
  const body = await req.json() as { angle?: number; swapWithId?: string; caption?: string; author?: string; source?: string };

  // Caption / author / source edits: allowed for the item's owner OR admin
  if (typeof body.caption === 'string' || typeof body.author === 'string' || typeof body.source === 'string') {
    const item = await db.item.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ownership check: admin bypasses, otherwise must be the session user who posted
    const isOwner = !!session.userId && item.author === (session.userName ?? '');
    if (!session.admin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // source: only 'board' or 'gallery' are valid
    const sourceVal = body.source === 'board' ? 'board' : body.source === 'gallery' ? 'gallery' : undefined;

    const updated = await db.item.update({
      where: { id },
      data: {
        ...(typeof body.caption === 'string' ? { caption: body.caption.trim() } : {}),
        ...(typeof body.author === 'string' ? { author: body.author.trim() || 'anonymous' } : {}),
        ...(sourceVal !== undefined ? { source: sourceVal } : {}),
      },
      include: { comments: true },
    });
    return NextResponse.json(updated);
  }

  // Tilt / reorder: admin only
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (body.swapWithId) {
    // Swap sortOrder between two items (for reorder ← / →)
    const [a, b] = await db.$transaction([
      db.item.findUnique({ where: { id } }),
      db.item.findUnique({ where: { id: body.swapWithId } }),
    ]);
    if (!a || !b) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.$transaction([
      db.item.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      db.item.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (typeof body.angle === 'number') {
    const item = await db.item.update({
      where: { id },
      data: { angle: Math.max(-22, Math.min(22, body.angle)) },
      include: { comments: true },
    });
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
}

/** DELETE /api/items/[id] — remove an item (admin only) */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const item = await db.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.item.delete({ where: { id } });

  // Best-effort: delete the image file from disk
  try {
    const filePath = path.join(UPLOADS_DIR, item.imgPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) { /* ignore */ }

  return NextResponse.json({ ok: true });
}
