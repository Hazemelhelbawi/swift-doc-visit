import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSlugFromPath } from "@/lib/reservedPaths";

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
  notFound: boolean;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

const DOCTOR_SLUG_KEY = "active_doctor_slug";

export const DoctorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const location = useLocation();

  // Get slug from URL path (clean URLs like /dr-ahmed-ali) or legacy query param.
  const pathSlug = getSlugFromPath(location.pathname);
  const querySlug = new URLSearchParams(location.search).get("doctor");
  const urlSlug = pathSlug || querySlug;

  // Persist slug in sessionStorage
  useEffect(() => {
    if (urlSlug) sessionStorage.setItem(DOCTOR_SLUG_KEY, urlSlug.toLowerCase());
  }, [urlSlug]);

  const resolveSlug = (): string | null => {
    if (urlSlug) return urlSlug.toLowerCase();
    const stored = sessionStorage.getItem(DOCTOR_SLUG_KEY);
    if (stored) return stored;
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    const isPreviewOrLocal =
      hostname.includes("localhost") ||
      hostname.includes("lovable") ||
      hostname.includes("lovableproject") ||
      hostname.includes("vercel");
    if (parts.length >= 3 && !isPreviewOrLocal) return parts[0].toLowerCase();
    return null;
  };

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        setError(null);
        setNotFound(false);
        const slug = resolveSlug();

        if (slug) {
          const { data: doctorBySlug } = await supabase
            .from("doctors")
            .select("id, slug, user_id, is_active")
            .eq("slug", slug)
            .eq("is_active", true)
            .maybeSingle();

          if (doctorBySlug) {
            setDoctor(doctorBySlug);
            setIsLoading(false);
            return;
          }
          // Slug was in URL but doesn't match a doctor
          if (pathSlug) {
            setNotFound(true);
            setIsLoading(false);
            return;
          }
        }

        // Fall back to the logged-in user's own doctor record
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: userDoctor } = await supabase
            .from("doctors")
            .select("id, slug, user_id, is_active")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .maybeSingle();
          if (userDoctor) {
            setDoctor(userDoctor);
            setIsLoading(false);
            return;
          }
        }

        // Final fallback: default doctor
        const { data: defaultDoctor } = await supabase
          .from("doctors")
          .select("id, slug, user_id, is_active")
          .eq("slug", "default")
          .eq("is_active", true)
          .maybeSingle();
        if (defaultDoctor) setDoctor(defaultDoctor);
        else setDoctor(null);
      } catch (err) {
        console.error("Error loading doctor:", err);
        setError("Failed to load doctor");
      } finally {
        setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") loadDoctor();
    });

    loadDoctor();
    return () => subscription.unsubscribe();
  }, [urlSlug, pathSlug]);

  return (
    <DoctorContext.Provider
      value={{
        doctor,
        doctorId: doctor?.id || null,
        isLoading,
        error,
        notFound,
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
