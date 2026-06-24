import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** GET /api/admin/me — check current session status */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return NextResponse.json({
    admin: !!session.admin,
    userId: session.userId ?? null,
    userName: session.userName ?? null,
  });
}
