import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** POST /api/admin/login — disabled, Google OAuth only */
export async function POST() {
  return NextResponse.json({ error: 'Password login disabled' }, { status: 403 });
}

/** DELETE /api/admin/login — logout */
export async function DELETE() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.admin = false;
  await session.save();
  return NextResponse.json({ ok: true });
}

