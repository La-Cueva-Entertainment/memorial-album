import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type Params = { params: Promise<{ id: string }> };

/** GET /api/quotes/[id]/comments — public */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const replies = await db.quoteReply.findMany({
    where: { quoteId: id },
    orderBy: { ts: 'asc' },
  });
  return NextResponse.json(replies);
}

/** POST /api/quotes/[id]/comments — anyone */
export async function POST(req: NextRequest, { params }: Params) {
  if (!rateLimit(getClientIp(req), 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { id } = await params;
  const quote = await db.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as { text?: string; author?: string; immichAssetId?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  const author = body.author?.trim() || 'anonymous';
  const immichAssetId = body.immichAssetId?.trim() || null;

  const reply = await db.quoteReply.create({
    data: { quoteId: id, text, author, immichAssetId },
  });
  return NextResponse.json(reply, { status: 201 });
}
