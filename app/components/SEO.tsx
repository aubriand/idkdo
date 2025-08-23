import { createMetadata, type SEOParams } from '@/app/lib/seo';

// Json-LD helper for structured data
export function JsonLd({ data }: { data: Record<string, unknown> | Array<unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// Utility to generate Metadata in server pages
export async function buildPageMetadata(params: SEOParams) {
  // Avoid calling next/headers here to prevent usage outside request scope.
  // For dynamic/host-aware needs, prefer per-page generateMetadata and pass headers there.
  return createMetadata(params);
}
// Canonical and meta should be emitted via Next.js Metadata API (generateMetadata) so they render in <head>.
