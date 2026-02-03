import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string;
  slug: string;
  email: string;
  user_id: string | null;
  is_active: boolean;
}

interface DoctorContextType {
  doctor: Doctor | null;
  doctorId: string | null;
  isLoading: boolean;
  error: string | null;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        // Extract doctor slug from subdomain
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        // Check if we have a subdomain (e.g., ahmed.yourdomain.com)
        // In development, we might use localhost or preview URLs
        let slug = 'default';
        
        // For production: extract subdomain
        if (parts.length >= 3 && !hostname.includes('localhost') && !hostname.includes('lovable.app')) {
          slug = parts[0];
        }
        
        // For preview/development, check URL params or use default
        const urlParams = new URLSearchParams(window.location.search);
        const doctorParam = urlParams.get('doctor');
        if (doctorParam) {
          slug = doctorParam;
        }

        const { data, error: fetchError } = await supabase
          .from('doctors')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setDoctor(data);
        } else {
          // Fallback to default doctor
          const { data: defaultDoctor } = await supabase
            .from('doctors')
            .select('*')
            .eq('slug', 'default')
            .eq('is_active', true)
            .maybeSingle();
          
          if (defaultDoctor) {
            setDoctor(defaultDoctor);
          } else {
            setError('No doctor found');
          }
        }
      } catch (err) {
        console.error('Error loading doctor:', err);
        setError('Failed to load doctor');
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctor();
  }, []);

  return (
    <DoctorContext.Provider value={{ 
      doctor, 
      doctorId: doctor?.id || null, 
      isLoading, 
      error 
    }}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) throw new Error('useDoctor must be used within DoctorProvider');
  return context;
};
