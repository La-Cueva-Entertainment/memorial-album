import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/ocean-spray/[id] — edit a post (admin only) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { title?: string; body?: string; imgPath?: string | null; pinned?: boolean };

  const post = await db.oceanSprayPost.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.body !== undefined && { body: body.body.trim() }),
      ...(body.imgPath !== undefined && { imgPath: body.imgPath || null }),
      ...(body.pinned !== undefined && { pinned: body.pinned }),
    },
  });
  return NextResponse.json(post);
}

/** DELETE /api/ocean-spray/[id] — admin only */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.oceanSprayPost.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
