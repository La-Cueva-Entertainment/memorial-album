import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kathryn Cali Lee';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? '';

/** Derive the public origin from the actual incoming request.
 *  Checks headers in priority order to handle Cloudflare → Nginx → Docker chains. */
async function getOrigin(): Promise<string> {
  try {
    const h = await headers();
    // x-forwarded-host is set by Nginx Proxy Manager when it has multiple upstreams
    const host =
      h.get('x-forwarded-host')?.split(',')[0].trim() ??
      h.get('host');
    // Cloudflare sets x-forwarded-proto; CF-Visitor is a fallback
    const cfVisitor = h.get('cf-visitor'); // e.g. {"scheme":"https"}
    const cfProto = cfVisitor ? (JSON.parse(cfVisitor) as { scheme?: string }).scheme : null;
    const proto = h.get('x-forwarded-proto')?.split(',')[0].trim() ?? cfProto ?? 'https';
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() throws outside of a request context (e.g. static build)
  }
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://welovekat.lacueva.us';
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
