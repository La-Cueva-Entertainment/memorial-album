import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processImage, saveUpload, MAX_BYTES, isValidImageBuffer } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** GET /api/items — returns all approved items with comments */
export async function GET() {
  const items = await db.item.findMany({
    where: { status: 'approved' },
    include: { comments: { orderBy: { ts: 'asc' } } },
    orderBy: [{ sortOrder: 'desc' }, { ts: 'desc' }],
  });
  return NextResponse.json(items);
}

/** POST /api/items — upload a board photo (cropped 1000×1000 from client canvas) */
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  const inputBuf = Buffer.from(arrayBuffer);
  if (!isValidImageBuffer(inputBuf)) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }

  // If the client sent the original full-res file, use it for Immich; fall back to canvas crop
  const originalFile = formData.get('originalFile') as File | null;
  let originalBuffer: Buffer = inputBuf;
  let originalMime: string = file.type || 'image/jpeg';
  if (originalFile && originalFile.size > 0) {
    originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    originalMime = originalFile.type || 'image/jpeg';
  }

  // Canvas crop is stored locally / used for board display; original goes to Immich
  const processed = await processImage(inputBuf, 1000, 0.88);
  const filename = await saveUpload(processed, 'jpg', originalBuffer, originalMime);

  const caption = (formData.get('caption') as string | null)?.trim() ?? '';
  const author = (formData.get('author') as string | null)?.trim() || 'anonymous';
  const angleRaw = formData.get('angle');
  const angle = angleRaw !== null && angleRaw !== '' ? parseFloat(angleRaw as string) : null;

  // sortOrder = current max + 1 so newest appears first in the masonry wall
  const agg = await db.item.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (agg._max.sortOrder ?? 0) + 1;

  const item = await db.item.create({
    data: { imgPath: filename, caption, author, source: 'board', angle, sortOrder },
    include: { comments: true },
  });

  return NextResponse.json(item, { status: 201 });
}

/** PATCH /api/items — bulk reorder board items (admin only)
 *  Body: { ids: string[] }  — ordered list of item IDs, first = highest sortOrder */
export async function PATCH(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { ids?: unknown };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }

  const ids = body.ids as string[];
  const total = ids.length;

  await db.$transaction(
    ids.map((id, i) =>
      db.item.update({ where: { id }, data: { sortOrder: total - i } })
    )
  );

  return NextResponse.json({ ok: true });
}
