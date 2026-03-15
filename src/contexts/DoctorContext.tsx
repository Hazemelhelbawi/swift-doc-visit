import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const doctorParam = urlParams.get("doctor");

        // Prefer URL ?doctor=slug so admin and all API requests use the same doctor consistently
        if (doctorParam) {
          const { data, error: fetchError } = await supabase
            .from("doctors")
            .select("*")
            .eq("slug", doctorParam)
            .eq("is_active", true)
            .maybeSingle();
          if (!fetchError && data) {
            setDoctor(data);
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        // If no URL param (or invalid slug), check if logged-in user is a doctor
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userDoctor, error: doctorError } = await supabase
            .from("doctors")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

          if (!doctorError && userDoctor) {
            setDoctor(userDoctor);
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise resolve by subdomain or default
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        let slug = "default";
        if (parts.length >= 3 && !hostname.includes("localhost")) {
          slug = parts[0];
        }

        const { data, error: fetchError } = await supabase
          .from("doctors")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setDoctor(data);
          setError(null);
        } else {
          const { data: defaultDoctor } = await supabase
            .from("doctors")
            .select("*")
            .eq("slug", "default")
            .eq("is_active", true)
            .maybeSingle();

          if (defaultDoctor) {
            setDoctor(defaultDoctor);
          } else {
            setError("No doctor found");
          }
        }
      } catch (err) {
        console.error("Error loading doctor:", err);
        setError("Failed to load doctor");
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes to reload doctor context
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setIsLoading(true);
        loadDoctor();
      }
    });

    loadDoctor();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <DoctorContext.Provider
      value={{
        doctor,
        doctorId: doctor?.id || null,
        isLoading,
        error,
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) throw new Error("useDoctor must be used within DoctorProvider");
  return context;
};
