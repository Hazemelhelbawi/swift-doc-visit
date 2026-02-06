import { useSearchParams } from 'react-router-dom';
import { useDoctor } from '@/contexts/DoctorContext';
import { useAuth } from '@/contexts/AuthContext';

const DOCTOR_SLUG_KEY = 'active_doctor_slug';

/**
 * Returns the current doctor slug from URL params, sessionStorage, or context.
 * Persists the slug in sessionStorage so it survives across navigations.
 */
export function useDoctorSlug() {
  const [searchParams] = useSearchParams();
  const { doctor } = useDoctor();
  const { user } = useAuth();
  
  const paramSlug = searchParams.get('doctor');
  
  // If URL has doctor param, persist it
  if (paramSlug) {
    sessionStorage.setItem(DOCTOR_SLUG_KEY, paramSlug);
  }
  
  // Priority: URL param > sessionStorage > logged-in doctor context
  const doctorSlug = paramSlug || sessionStorage.getItem(DOCTOR_SLUG_KEY) || doctor?.slug;
  
  // Check if the current logged-in user IS the doctor (not just if doctor has a user_id)
  const isLoggedInDoctor = !!(user && doctor?.user_id && user.id === doctor.user_id);
  
  // Helper to build a path with the doctor param preserved
  const buildPath = (path: string) => {
    if (!doctorSlug || isLoggedInDoctor) {
      // If logged-in as this doctor, no need for query param
      return path;
    }
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}doctor=${doctorSlug}`;
  };
  
  return { doctorSlug, buildPath };
}
