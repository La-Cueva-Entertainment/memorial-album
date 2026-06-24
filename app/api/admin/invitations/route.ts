import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

function adminGuard(session: SessionData) {
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

/** GET /api/admin/invitations — list all invitations */
export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const denied = adminGuard(session);
  if (denied) return denied;

  const invitations = await db.invitation.findMany({
    include: { users: { select: { id: true, name: true, role: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(invitations);
}

/** POST /api/admin/invitations — create a new invitation */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const denied = adminGuard(session);
  if (denied) return denied;

  const body = await req.json() as { role?: string; note?: string; expiresInDays?: number; multiUse?: boolean };
  const validRoles = ['admin', 'contributor', 'super_contributor'];
  const role = validRoles.includes(body.role ?? '') ? body.role! : 'contributor';
  const note = body.note?.trim() ?? '';
  const multiUse = body.multiUse !== false; // default true
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86_400_000)
    : null;

  const invitation = await db.invitation.create({ data: { role, note, multiUse, expiresAt } });
  return NextResponse.json(invitation, { status: 201 });
}

/** DELETE /api/admin/invitations?id=xxx — revoke an invitation */
export async function DELETE(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const denied = adminGuard(session);
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await db.invitation.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
