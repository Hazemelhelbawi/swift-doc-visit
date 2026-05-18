import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
  const navigate = useNavigate();
  const { doctor } = useDoctor();
  const { user } = useAuth();

  const pathSlug = getSlugFromPath(location.pathname);

  // Legacy: support ?doctor=slug links by redirecting to /:slug
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const legacy = params.get('doctor');
    if (legacy && !pathSlug) {
      params.delete('doctor');
      const rest = params.toString();
      const target = `/${legacy.toLowerCase()}${location.pathname === '/' ? '' : location.pathname}${rest ? `?${rest}` : ''}`;
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.search, pathSlug, navigate]);

  if (pathSlug) {
    sessionStorage.setItem(DOCTOR_SLUG_KEY, pathSlug);
  }

  const doctorSlug =
    pathSlug || sessionStorage.getItem(DOCTOR_SLUG_KEY) || doctor?.slug || null;

  const isLoggedInDoctor = !!(user && doctor?.user_id && user.id === doctor.user_id);

  /**
   * Build a path prefixed with the active doctor slug.
   * `path` should start with "/" (e.g. "/book", "/about").
   */
  const buildPath = (path: string) => {
    const clean = path.startsWith('/') ? path : `/${path}`;
    if (!doctorSlug) return clean;
    // For logged-in doctors visiting their own admin, still emit slug-prefixed
    // public URLs so canonical/SEO links stay consistent.
    if (clean === '/') return `/${doctorSlug}`;
    return `/${doctorSlug}${clean}`;
  };

  return { doctorSlug, buildPath, isLoggedInDoctor };
}
