import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

type Params = { params: Promise<{ token: string }> };

/** GET /api/invite/[token] — check if the invitation is valid */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const invite = await db.invitation.findUnique({ where: { token } });

  if (!invite) return NextResponse.json({ valid: false, reason: 'not_found' });
  // Single-use invites block after first use
  if (!invite.multiUse && invite.usedAt) return NextResponse.json({ valid: false, reason: 'already_used' });
  if (invite.expiresAt && invite.expiresAt < new Date())
    return NextResponse.json({ valid: false, reason: 'expired' });

  return NextResponse.json({ valid: true, role: invite.role, note: invite.note });
}

/** POST /api/invite/[token] — redeem the invitation */
export async function POST(req: NextRequest, { params }: Params) {
  if (!rateLimit(getClientIp(req), 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { token } = await params;
  const body = await req.json() as { name?: string };
  const name = body.name?.trim() || 'Anonymous';

  const invite = await db.invitation.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 });
  if (!invite.multiUse && invite.usedAt) return NextResponse.json({ error: 'Invitation already used' }, { status: 400 });
  if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });

  // New registrations are always contributor — admin promotes manually
  const user = await db.user.create({
    data: { name, role: 'contributor', inviteId: invite.id },
  });

  // Increment use count; only mark usedAt for single-use invites
  await db.invitation.update({
    where: { id: invite.id },
    data: {
      useCount: { increment: 1 },
      ...(invite.multiUse ? {} : { usedAt: new Date() }),
    },
  });

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.userId = user.id;
  session.userName = user.name;
  session.admin = false;
  await session.save();

  return NextResponse.json({ ok: true, admin: false });
}