import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

/** GET /api/quotes — all quotes, newest first */
export async function GET() {
  try {
    const quotes = await db.quote.findMany({
      orderBy: { ts: 'desc' },
      include: { replies: { orderBy: { ts: 'asc' } } },
    });
    return NextResponse.json(quotes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/quotes — add a quote */
export async function POST(req: NextRequest) {
  if (!rateLimit(getClientIp(req), 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const body = await req.json() as { text?: string; author?: string; immichAssetId?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  const author = body.author?.trim() || 'Cali';
  const immichAssetId = body.immichAssetId?.trim() || null;
  const quote = await db.quote.create({ data: { text, author, immichAssetId } });
  return NextResponse.json(quote, { status: 201 });
}
