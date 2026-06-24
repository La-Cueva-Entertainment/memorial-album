import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/** GET /api/notes — all guestbook notes, newest first */
export async function GET() {
  const notes = await db.guestbookNote.findMany({ orderBy: { ts: 'desc' } });
  return NextResponse.json(notes);
}

/** POST /api/notes — add a guestbook note */
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const body = await req.json() as { text?: string; author?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  const author = body.author?.trim() || 'anonymous';
  const note = await db.guestbookNote.create({ data: { text, author } });
  return NextResponse.json(note, { status: 201 });
}
