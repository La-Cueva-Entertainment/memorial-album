import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

async function canEdit(session: SessionData): Promise<boolean> {
  if (session.admin) return true;
  if (!session.userId) return false;
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return user?.role === 'super_contributor';
}

/** DELETE /api/favorite-things/[id] — admin or super_contributor */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!(await canEdit(session))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await db.favoriteThing.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
