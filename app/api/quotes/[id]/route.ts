import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/quotes/[id] — admin only */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const quote = await db.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
