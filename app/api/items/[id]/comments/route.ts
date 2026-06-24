import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

/** POST /api/items/[id]/comments — add a comment to an item */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as { text?: string; author?: string };

  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });
  const author = body.author?.trim() || 'anonymous';

  const item = await db.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const comment = await db.comment.create({ data: { itemId: id, text, author } });
  return NextResponse.json(comment, { status: 201 });
}
