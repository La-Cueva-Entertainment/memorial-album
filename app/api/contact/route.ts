import { NextResponse } from 'next/server';

/**
 * GET /api/contact
 * Returns the mailto href as JSON — email address stays server-side only.
 */
export async function GET() {
  const email = process.env.CONTACT_EMAIL;
  if (!email) {
    return NextResponse.json({ href: null }, { status: 200 });
  }
  const subject = encodeURIComponent('Memorial site — message');
  return NextResponse.json(
    { href: `mailto:${email}?subject=${subject}` },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
