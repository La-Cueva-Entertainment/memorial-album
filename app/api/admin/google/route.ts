import { NextRequest, NextResponse } from 'next/server';

/** Derive the public-facing origin from the request, respecting reverse-proxy headers. */
function getOrigin(req: NextRequest): string {
  const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const fwdHost  = req.headers.get('x-forwarded-host')?.split(',')[0].trim()
                ?? req.headers.get('host')?.split(',')[0].trim();
  if (fwdProto && fwdHost) return `${fwdProto}://${fwdHost}`;
  const { protocol, host } = new URL(req.url);
  return process.env.NEXT_PUBLIC_BASE_URL ?? `${protocol}//${host}`;
}

/**
 * GET /api/admin/google
 * Redirects to Google OAuth consent screen.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${getOrigin(req)}/api/admin/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 501 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
