import type { Metadata } from 'next';
import { headers as nextHeaders } from 'next/headers';

type H = Headers | Readonly<Headers> | Record<string, string> | undefined | null | Promise<Headers>;

export type SEOParams = {
  title: string;
  description?: string;
  path?: string; // pathname like "/groups/123"
  image?: string; // absolute or relative to base
  noIndex?: boolean;
  type?: 'website' | 'article' | 'profile' | 'book' | 'music.song' | 'music.album' | 'music.playlist' | 'music.radio_station' | 'video.movie' | 'video.episode' | 'video.tv_show' | 'video.other';
};

export async function resolveBaseUrl(h?: H): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  try {
  // Prefer forwarded headers on proxies
  const raw = h ? (h instanceof Promise ? await h : h) : await nextHeaders();
  const hs = raw instanceof Headers ? raw : new Headers(raw as Record<string, string>);
    const proto = (hs.get?.('x-forwarded-proto') || 'https').split(',')[0].trim();
    const host = (hs.get?.('x-forwarded-host') || hs.get?.('host') || 'localhost:3000').split(',')[0].trim();
    return `${proto}://${host}`;
  } catch {
    return 'http://localhost:3000';
  }
}

export function toAbsoluteUrl(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

export async function createMetadata(params: SEOParams, h?: H): Promise<Metadata> {
  const base = await resolveBaseUrl(h);
  const canonical = params.path ? new URL(params.path, base).toString() : base;
  const imageAbs = toAbsoluteUrl(params.image, base);
  const siteName = 'IDKDO';

  return {
    title: params.title,
    description: params.description,
    metadataBase: new URL(base),
    alternates: { canonical },
    robots: params.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: params.type ?? 'website',
      url: canonical,
      siteName,
      title: params.title,
      description: params.description,
      images: imageAbs ? [{ url: imageAbs }] : undefined,
    },
    twitter: {
      card: imageAbs ? 'summary_large_image' : 'summary',
      title: params.title,
      description: params.description,
      images: imageAbs ? [imageAbs] : undefined,
    },
  } satisfies Metadata;
}
