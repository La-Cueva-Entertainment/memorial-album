import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** GET /api/users/me — return current session user info */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) return NextResponse.json({ user: null });
  const user = await db.user.findUnique({ where: { id: session.userId } });
  return NextResponse.json({ user });
}

/** PATCH /api/users/me — update display name */
export async function PATCH(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.userId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await req.json() as { name?: string };
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  await db.user.update({ where: { id: session.userId }, data: { name } });
  session.userName = name;
  await session.save();

  return NextResponse.json({ ok: true, name });
}
