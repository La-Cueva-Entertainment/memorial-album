import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/[id] — promote or demote a user */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { role?: string };
  const validRoles = ['admin', 'contributor', 'super_contributor'];
  const role = validRoles.includes(body.role ?? '') ? body.role! : 'contributor';

  const user = await db.user.update({ where: { id }, data: { role } });
  return NextResponse.json(user);
}
