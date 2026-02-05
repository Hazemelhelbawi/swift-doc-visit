import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDoctor } from '@/contexts/DoctorContext';

export interface DoctorProfile {
  name: string;
  name_ar: string;
  specialty: string;
  specialty_ar: string;
  experience_years: number;
  patients_count: number;
  rating: number;
  image_url?: string;
  education: Array<{
    degree: string;
    degree_ar: string;
    institution: string;
    institution_ar: string;
    year: string;
  }>;
  specializations: Array<{ en: string; ar: string }>;
  achievements: Array<{ en: string; ar: string }>;
  philosophy: string;
  philosophy_ar: string;
}

export interface HeroContent {
  tagline: string;
  tagline_ar: string;
  title: string;
  title_ar: string;
  subtitle: string;
  subtitle_ar: string;
  image_url?: string;
}

export interface ServiceItem {
  icon: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
}

export interface ServicesContent {
  items: ServiceItem[];
}

export function useSiteSettings<T>(key: string) {
  const { doctorId } = useDoctor();
  
  return useQuery({
    queryKey: ['site-settings', key, doctorId],
    queryFn: async (): Promise<T | null> => {
      if (!doctorId) return null;
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .eq('doctor_id', doctorId)
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as T) ?? null;
    },
    enabled: !!doctorId,
  });
}

export function useUpdateSiteSettings<T>() {
  const queryClient = useQueryClient();
  const { doctorId } = useDoctor();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: T }) => {
      if (!doctorId) throw new Error('No doctor context');
      
      // Use upsert to handle both insert and update
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key, value: value as any, doctor_id: doctorId },
          { onConflict: 'key,doctor_id' }
        );
      
      if (error) throw error;
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['site-settings', key, doctorId] });
    },
  });
}

export function useDoctorProfile() {
  return useSiteSettings<DoctorProfile>('doctor_profile');
}

export function useHeroContent() {
  return useSiteSettings<HeroContent>('hero_content');
}

export function useServicesContent() {
  return useSiteSettings<ServicesContent>('services');
}
