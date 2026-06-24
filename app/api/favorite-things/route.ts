import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

async function canEdit(session: SessionData): Promise<boolean> {
  if (session.admin) return true;
  if (!session.userId) return false;
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  return user?.role === 'super_contributor';
}

/** GET /api/favorite-things — all favorites, oldest first */
export async function GET() {
  const items = await db.favoriteThing.findMany({ orderBy: { ts: 'asc' } });
  return NextResponse.json(items);
}

/** POST /api/favorite-things — add a favorite (admin or super_contributor) */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!(await canEdit(session))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { name?: string; emoji?: string; category?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const item = await db.favoriteThing.create({
    data: {
      name,
      emoji: body.emoji?.trim() || '⭐',
      category: body.category?.trim() || '',
    },
  });
  return NextResponse.json(item, { status: 201 });
}
