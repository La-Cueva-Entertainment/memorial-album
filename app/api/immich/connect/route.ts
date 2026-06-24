import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

/** Validate that a URL is an http/https URL (guards against SSRF). */
function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /api/immich/connect
 * Body: { serverUrl, apiKey }
 * Validates credentials against the Immich server, stores them in the session,
 * and returns the first page of assets.
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as { serverUrl?: string; apiKey?: string };
  const serverUrl = body.serverUrl?.replace(/\/$/, ''); // strip trailing slash
  const apiKey = body.apiKey?.trim();

  if (!serverUrl || !apiKey) {
    return NextResponse.json({ error: 'serverUrl and apiKey are required' }, { status: 400 });
  }
  if (!isSafeUrl(serverUrl)) {
    return NextResponse.json({ error: 'Invalid server URL' }, { status: 400 });
  }

  // Try to fetch assets from Immich
  let assets: unknown[];
  try {
    const res = await fetch(`${serverUrl}/api/assets?take=100&skip=0`, {
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Immich returned ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }
    assets = await res.json() as unknown[];
  } catch (err) {
    return NextResponse.json({ error: 'Could not reach the Immich server' }, { status: 502 });
  }

  // Store credentials in the session for subsequent thumbnail/import calls
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.immich = { serverUrl, apiKey };
  await session.save();

  return NextResponse.json({ assets });
}

/**
 * DELETE /api/immich/connect
 * Clears Immich credentials from the session.
 */
export async function DELETE() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  delete session.immich;
  await session.save();
  return NextResponse.json({ ok: true });
}
