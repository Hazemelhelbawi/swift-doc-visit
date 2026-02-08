import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDoctor } from '@/contexts/DoctorContext';

const DEFAULT_DOCTOR_PROFILE = {
  name: 'Doctor Name',
  name_ar: 'اسم الطبيب',
  specialty: 'General Medicine',
  specialty_ar: 'طب عام',
  experience_years: 0,
  patients_count: 0,
  rating: 5,
  image_url: '',
  philosophy: 'Providing compassionate, patient-centered care.',
  philosophy_ar: 'تقديم رعاية صحية شاملة تركز على المريض.',
  education: [],
  specializations: [],
  achievements: [],
};

const DEFAULT_HERO_CONTENT = {
  title: 'Your Health, Our Priority',
  title_ar: 'صحتك، أولويتنا',
  subtitle: 'Expert medical care with a personal touch. Book your appointment today.',
  subtitle_ar: 'رعاية طبية متميزة بلمسة شخصية. احجز موعدك اليوم.',
  tagline: 'Welcome',
  tagline_ar: 'مرحباً',
  image_url: '',
};

const DEFAULT_SERVICES = {
  items: [
    {
      icon: 'Stethoscope',
      title: 'General Checkup',
      title_ar: 'الفحص العام',
      description: 'Comprehensive health assessments.',
      description_ar: 'تقييمات صحية شاملة.',
    },
    {
      icon: 'Heart',
      title: 'Medical Consultation',
      title_ar: 'الاستشارة الطبية',
      description: 'Expert medical advice for your health concerns.',
      description_ar: 'نصائح طبية متخصصة لمخاوفك الصحية.',
    },
  ],
};

export function useSeedDoctorDefaults() {
  const { doctorId } = useDoctor();
  const seeded = useRef(false);

  useEffect(() => {
    if (!doctorId || seeded.current) return;
    seeded.current = true;

    const seed = async () => {
      try {
        // Check if any settings exist for this doctor
        const { data: existing } = await supabase
          .from('site_settings')
          .select('key')
          .eq('doctor_id', doctorId);

        if (existing && existing.length > 0) return; // Already has settings

        const defaults = [
          { key: 'doctor_profile', value: DEFAULT_DOCTOR_PROFILE, doctor_id: doctorId },
          { key: 'hero_content', value: DEFAULT_HERO_CONTENT, doctor_id: doctorId },
          { key: 'services', value: DEFAULT_SERVICES, doctor_id: doctorId },
        ];

        const { error } = await supabase
          .from('site_settings')
          .insert(defaults as any);

        if (error) {
          console.error('Error seeding defaults:', error);
        } else {
          console.log('Default settings seeded for doctor:', doctorId);
        }
      } catch (err) {
        console.error('Error in seed defaults:', err);
      }
    };

    seed();
  }, [doctorId]);
}
