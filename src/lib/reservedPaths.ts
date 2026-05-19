// Top-level paths that are NOT doctor slugs. Keep in sync with App routes.
export const RESERVED_PATHS = new Set<string>([
  "auth",
  "dashboard",
  "admin",
  "pricing",
  "api",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/**
 * Extracts a doctor slug from a pathname like "/dr-ahmed-ali/book".
 * Returns null if the first segment is reserved or empty.
 */
export function getSlugFromPath(pathname: string): string | null {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) return null;
  if (RESERVED_PATHS.has(first.toLowerCase())) return null;
  return first.toLowerCase();
}

export function isReservedSegment(segment: string): boolean {
  return RESERVED_PATHS.has(segment.toLowerCase());
}
