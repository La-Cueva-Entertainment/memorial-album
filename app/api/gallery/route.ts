import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processImage, saveUpload, MAX_BYTES, isValidImageBuffer } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/gallery — mass-upload images to the Photo Box.
 * Expects multipart/form-data with:
 *   - files[]: one or more image files
 *   - author: string (applied to all)
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const formData = await req.formData();
  const author = (formData.get('author') as string | null)?.trim() || 'anonymous';

  const fileEntries = formData.getAll('files') as File[];
  if (!fileEntries.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

  const created = [];
  const agg = await db.item.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (agg._max.sortOrder ?? 0) + 1;

  for (const file of fileEntries) {
    if (!file.type.startsWith('image/')) continue;

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) continue; // skip oversized

    const inputBuf = Buffer.from(arrayBuffer);
    if (!isValidImageBuffer(inputBuf)) continue; // skip non-images

    const processed = await processImage(inputBuf, 1100, 0.8);
    const filename = await saveUpload(processed, 'jpg', inputBuf, file.type || 'image/jpeg');

    const item = await db.item.create({
      data: { imgPath: filename, caption: '', author, source: 'gallery', sortOrder },
      include: { comments: true },
    });
    created.push(item);
    sortOrder++;
  }

  return NextResponse.json(created, { status: 201 });
}
