import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kathryn Cali Lee';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? '';

/** Derive the public origin from the actual incoming request.
 *
 *  IMPORTANT: NGINX Proxy Manager internally proxies to Docker over HTTP and
 *  therefore overwrites X-Forwarded-Proto with "http" before the request reaches
 *  Next.js — even though Cloudflare → Nginx is HTTPS.  We must NOT trust that
 *  header for the scheme.  Instead: any host that isn't localhost / a private-IP
 *  range is always HTTPS in production. */
async function getOrigin(): Promise<string> {
  // Prefer an explicit env var so the URL is always deterministic.
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (envBase) return envBase;

  try {
    const h = await headers();
    // x-forwarded-host is set by NPM; fall back to Host.
    const host =
      h.get('x-forwarded-host')?.split(',')[0].trim() ??
      h.get('host');
    if (host) {
      // Use http only for local / private-IP development; always https otherwise.
      const isLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host);
      return `${isLocal ? 'http' : 'https'}://${host}`;
    }
  } catch {
    // headers() unavailable outside of a request context
  }
  return 'https://welovekat.lacueva.us';
}

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getOrigin();

  // /api/og-image always returns a rendered PNG — portrait + site name.
  // Using a dedicated route avoids proxy-auth issues that affect /api/immich/thumbnail.
  const ogImageUrl = `${origin}/api/og-image`;

  return {
    metadataBase: new URL(origin),
    title: SITE_NAME,
    description: 'A shared memorial scrapbook',
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      title: SITE_NAME,
      description: 'A shared memorial scrapbook',
      type: 'website',
      siteName: SITE_NAME,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: 'A shared memorial scrapbook',
      images: [ogImageUrl],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Hard noindex for crawlers that ignore HTTP headers */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Optional self-hosted Plausible analytics — set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to enable */}
        {PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
