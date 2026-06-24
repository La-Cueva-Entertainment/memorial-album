import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * GET /api/admin/backup
 * Downloads the SQLite database after flushing the WAL.
 * Protected by a static BACKUP_SECRET token set in env vars.
 * Called by the Unraid backup script — no session needed (scripts can't hold cookies).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.BACKUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Backup not configured (BACKUP_SECRET not set)' }, { status: 501 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Flush WAL to main DB file so the copy is consistent
  await db.$executeRawUnsafe('PRAGMA wal_checkpoint(FULL)');

  const dbUrl = process.env.DATABASE_URL ?? 'file:./data/dev.db';
  const dbPath = dbUrl.replace(/^file:/, '');
  const resolved = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  if (!existsSync(resolved)) {
    return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
  }

  const buf = await readFile(resolved);
  const filename = `lovecali-backup-${new Date().toISOString().slice(0, 10)}.db`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buf.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
