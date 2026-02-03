import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDoctor } from '@/contexts/DoctorContext';
import { useEffect } from 'react';

export interface ThemeSettings {
  primary_color: string;
  accent_color: string;
}

const defaultTheme: ThemeSettings = {
  primary_color: '#1DAFA1',
  accent_color: '#E8655A',
};

// Convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 174, s: 72, l: 40 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function useThemeSettings() {
  const { doctorId } = useDoctor();

  const query = useQuery({
    queryKey: ['theme-settings', doctorId],
    queryFn: async () => {
      if (!doctorId) return defaultTheme;
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'theme_settings')
        .eq('doctor_id', doctorId)
        .maybeSingle();

      if (error) throw error;
      if (!data?.value) return defaultTheme;
      const value = data.value as Record<string, unknown>;
      return {
        primary_color: (value.primary_color as string) || defaultTheme.primary_color,
        accent_color: (value.accent_color as string) || defaultTheme.accent_color,
      };
    },
    enabled: !!doctorId,
  });

  // Apply theme colors to CSS variables
  useEffect(() => {
    const theme = query.data || defaultTheme;
    const root = document.documentElement;
    
    const primaryHSL = hexToHSL(theme.primary_color);
    const accentHSL = hexToHSL(theme.accent_color);

    // Apply primary color variations
    root.style.setProperty('--primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    root.style.setProperty('--primary-light', `${primaryHSL.h} ${Math.max(primaryHSL.s - 7, 0)}% 95%`);
    root.style.setProperty('--primary-dark', `${primaryHSL.h} ${primaryHSL.s}% ${Math.max(primaryHSL.l - 10, 10)}%`);
    root.style.setProperty('--ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    
    // Sidebar colors
    root.style.setProperty('--sidebar-primary', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);
    root.style.setProperty('--sidebar-accent', `${primaryHSL.h} ${Math.max(primaryHSL.s - 7, 0)}% 95%`);
    root.style.setProperty('--sidebar-accent-foreground', `${primaryHSL.h} ${primaryHSL.s}% ${Math.max(primaryHSL.l - 10, 10)}%`);
    root.style.setProperty('--sidebar-ring', `${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%`);

    // Apply accent color
    root.style.setProperty('--accent', `${accentHSL.h} ${accentHSL.s}% ${accentHSL.l}%`);
    root.style.setProperty('--accent-light', `${accentHSL.h} ${accentHSL.s}% 95%`);

  }, [query.data]);

  return query;
}
