import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** POST /api/admin/login */
export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !body.password || body.password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.admin = true;
  await session.save();

  return NextResponse.json({ admin: true });
}
