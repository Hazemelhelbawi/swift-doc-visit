import { useLocation } from 'react-router-dom';
import { useDoctor } from '@/contexts/DoctorContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSlugFromPath } from '@/lib/reservedPaths';

const DOCTOR_SLUG_KEY = 'active_doctor_slug';

/**
 * Returns the current doctor slug from the URL path, sessionStorage, or context.
 * Builds clean URLs prefixed with the slug, e.g. /dr-ahmed-ali/book.
 */
export function useDoctorSlug() {
  const location = useLocation();
  const { doctor } = useDoctor();
  const { user } = useAuth();

  const pathSlug = getSlugFromPath(location.pathname);

  if (pathSlug) {
    sessionStorage.setItem(DOCTOR_SLUG_KEY, pathSlug);
  }

  const doctorSlug =
    pathSlug || sessionStorage.getItem(DOCTOR_SLUG_KEY) || doctor?.slug || null;

  const isLoggedInDoctor = !!(user && doctor?.user_id && user.id === doctor.user_id);

  /**
   * Build a path prefixed with the active doctor slug.
   * `path` should start with "/" (e.g. "/book", "/about").
   * Admin paths (/admin, /dashboard, /auth) are returned unprefixed.
   */
  const buildPath = (path: string) => {
    const clean = path.startsWith('/') ? path : `/${path}`;
    // Don't prefix admin/auth/dashboard paths
    if (
      clean === '/dashboard' ||
      clean.startsWith('/admin') ||
      clean.startsWith('/auth')
    ) {
      return clean;
    }
    if (!doctorSlug) return clean;
    if (clean === '/') return `/${doctorSlug}`;
    return `/${doctorSlug}${clean}`;
  };

  return { doctorSlug, buildPath, isLoggedInDoctor };
}
