import type { Metadata } from 'next';
import { db } from '@/lib/db';
import './globals.css';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kathryn Cali Lee';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lovecali.com';
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? '';

export async function generateMetadata(): Promise<Metadata> {
  let ogImageUrl: string | undefined;

  try {
    const portraitConfig = await db.siteConfig.findUnique({ where: { key: 'bio_hero_img_path' } });
    if (portraitConfig?.value?.startsWith('immich:')) {
      const assetId = portraitConfig.value.slice(7);
      ogImageUrl = `${BASE_URL}/api/immich/thumbnail?assetId=${assetId}`;
    }
  } catch {
    // DB may not be available at build time — ignore
  }

  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 600, height: 600, alt: SITE_NAME }]
    : [];

  return {
    metadataBase: new URL(BASE_URL),
    title: SITE_NAME,
    description: 'A shared memorial scrapbook',
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      title: SITE_NAME,
      description: 'A shared memorial scrapbook',
      type: 'website',
      siteName: SITE_NAME,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: 'A shared memorial scrapbook',
      images: ogImageUrl ? [ogImageUrl] : [],
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
