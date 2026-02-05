import { useSearchParams } from 'react-router-dom';
import { useDoctor } from '@/contexts/DoctorContext';

/**
 * Returns the current doctor slug from URL params or context
 * Also provides a helper to build links that preserve the doctor param
 */
export function useDoctorSlug() {
  const [searchParams] = useSearchParams();
  const { doctor } = useDoctor();
  
  // Get slug from URL or from logged-in doctor
  const doctorSlug = searchParams.get('doctor') || doctor?.slug;
  
  // Helper to build a path with the doctor param preserved
  const buildPath = (path: string) => {
    if (!doctorSlug || doctor?.user_id) {
      // If logged-in doctor, no need for query param
      return path;
    }
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}doctor=${doctorSlug}`;
  };
  
  return { doctorSlug, buildPath };
}
