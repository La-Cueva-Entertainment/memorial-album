import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import type { SessionData } from '@/lib/session';

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  email?: string;
  sub?: string;
}

/**
 * GET /api/admin/google/callback
 * Handles the OAuth2 callback from Google, validates the email against
 * GOOGLE_ADMIN_EMAILS (comma-separated), and establishes an admin session.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const fwdHost  = req.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const reqOrigin = (fwdProto && fwdHost)
    ? `${fwdProto}://${fwdHost}`
    : (() => { const u = new URL(req.url); return process.env.NEXT_PUBLIC_BASE_URL ?? `${u.protocol}//${u.host}`; })();
  const baseUrl = reqOrigin;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${baseUrl}/api/admin/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const allowedEmails = (process.env.GOOGLE_ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  const tokens = await tokenRes.json() as TokenResponse;
  if (!tokens.access_token) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  const user = await userRes.json() as GoogleUserInfo;
  const email = user.email?.toLowerCase() ?? '';

  // Check allowlist — if GOOGLE_ADMIN_EMAILS is empty, deny all
  if (!allowedEmails.length || !allowedEmails.includes(email)) {
    return NextResponse.redirect(`${baseUrl}/?auth=denied`);
  }

  // Grant admin session
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.admin = true;
  await session.save();

  return NextResponse.redirect(`${baseUrl}/?auth=ok`);
}
