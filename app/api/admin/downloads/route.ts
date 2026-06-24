import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import fs from 'fs';
import path from 'path';
import { UPLOADS_DIR } from '@/lib/storage';

/** GET /api/admin/downloads — list all uploaded files with metadata */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await db.item.findMany({
    select: { id: true, imgPath: true, caption: true, author: true, ts: true, source: true },
    orderBy: { ts: 'desc' },
  });

  // Enrich with file size
  const files = items.map(item => {
    const filePath = path.join(UPLOADS_DIR, item.imgPath);
    let sizeBytes = 0;
    try {
      sizeBytes = fs.statSync(filePath).size;
    } catch (_) { /* file might be missing */ }
    return { ...item, sizeBytes };
  });

  return NextResponse.json(files);
}
