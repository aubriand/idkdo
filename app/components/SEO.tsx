import * as React from 'react';
import { createMetadata, resolveBaseUrl, toAbsoluteUrl, type SEOParams } from '@/app/lib/seo';

// Json-LD helper for structured data
export function JsonLd({ data }: { data: Record<string, unknown> | Array<unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Utility to generate Metadata in server pages
export async function buildPageMetadata(params: SEOParams) {
  // Avoid calling next/headers here to prevent usage outside request scope.
  // For dynamic/host-aware needs, prefer per-page generateMetadata and pass headers there.
  return createMetadata(params);
}

// Convenience component for canonical link and meta tags in client/server layouts if needed
export function Canonical({ path, image, title, description }: { path?: string; image?: string; title?: string; description?: string }) {
  const base = resolveBaseUrl();
  const href = path ? new URL(path, base).toString() : base;
  const img = toAbsoluteUrl(image, base);
  return (
    <>
      <link rel="canonical" href={href} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta name="description" content={description} />}
      <meta property="og:url" content={href} />
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
    </>
  );
}
