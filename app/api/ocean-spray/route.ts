import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** GET /api/ocean-spray — all posts, pinned first then newest */
export async function GET() {
  const posts = await db.oceanSprayPost.findMany({
    orderBy: [{ pinned: 'desc' }, { ts: 'asc' }],
  });
  return NextResponse.json(posts);
}

/** POST /api/ocean-spray — admin only */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { title?: string; body?: string; imgPath?: string; pinned?: boolean };
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const post = await db.oceanSprayPost.create({
    data: {
      title,
      body: body.body?.trim() ?? '',
      imgPath: body.imgPath?.trim() || null,
      pinned: body.pinned ?? false,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
