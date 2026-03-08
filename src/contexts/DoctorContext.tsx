import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Doctor {
  id: string;
  slug: string;
  email?: string;
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

const DOCTOR_SLUG_KEY = "active_doctor_slug";

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Get slug from URL param reactively
  const doctorParam = searchParams.get("doctor");

  // Persist slug in sessionStorage
  useEffect(() => {
    if (doctorParam) {
      sessionStorage.setItem(DOCTOR_SLUG_KEY, doctorParam);
    }
  }, [doctorParam]);

  // Resolve the effective slug: URL param > sessionStorage > subdomain > default
  const resolveSlug = (): string => {
    if (doctorParam) return doctorParam;

    const stored = sessionStorage.getItem(DOCTOR_SLUG_KEY);
    if (stored) return stored;

    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const isPreviewOrLocal = hostname.includes("localhost") || hostname.includes("lovable") || hostname.includes("lovableproject");
    if (parts.length >= 3 && !isPreviewOrLocal) {
      return parts[0];
    }

    return "default";
  };

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setIsLoading(true);

        // First, check if logged-in user is a doctor
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userDoctor, error: doctorError } = await supabase
            .from("doctors")
            .select("id, slug, user_id, is_active")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();

          if (!doctorError && userDoctor) {
            // If there's a URL slug for a DIFFERENT doctor, don't override
            const slug = resolveSlug();
            if (slug === "default" || slug === userDoctor.slug) {
              console.log("Found doctor for logged-in user:", userDoctor.slug);
              setDoctor(userDoctor);
              setIsLoading(false);
              return;
            }
            // Otherwise fall through to load the requested doctor
          }
        }

        // Load doctor by slug using RPC (works for unauthenticated users too)
        const slug = resolveSlug();

        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_doctor_by_slug", { p_slug: slug });

        if (rpcError) throw rpcError;

        if (rpcData && rpcData.length > 0) {
          setDoctor(rpcData[0] as Doctor);
        } else {
          // Fallback to default doctor
          const { data: defaultData } = await supabase
            .rpc("get_doctor_by_slug", { p_slug: "default" });

          if (defaultData && defaultData.length > 0) {
            setDoctor(defaultData[0] as Doctor);
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
        loadDoctor();
      }
    });

    loadDoctor();

    return () => subscription.unsubscribe();
  }, [doctorParam]); // Re-run when URL doctor param changes

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
