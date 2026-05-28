/**
 * Pure helper used by the Auth page to decide where to send a logged-in user.
 * Extracted so it can be unit-tested independently of React/router.
 *
 * Rules:
 * - If `explicit` (the ?redirect= query param) is provided, prefer it.
 * - Otherwise admins go to /admin, non-admins go to /.
 * - Admin / dashboard paths must NEVER be prefixed with a doctor slug —
 *   the legacy ?doctor= handler would rewrite /admin?doctor=x into
 *   /x/admin which is a 404.
 * - Non-admin paths may be suffixed with ?doctor=<slug> when a slug is known.
 */
export function getRedirectPath(opts: {
  explicit?: string | null;
  isAdmin: boolean;
  doctorSlug?: string | null;
}): string {
  const { explicit, isAdmin, doctorSlug } = opts;
  const basePath = explicit || (isAdmin ? "/admin" : "/");

  const isAdminPath =
    basePath === "/admin" ||
    basePath.startsWith("/admin/") ||
    basePath === "/dashboard";

  if (isAdminPath) return basePath;
  if (!doctorSlug || basePath === "/") return basePath;
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}doctor=${doctorSlug}`;
}
