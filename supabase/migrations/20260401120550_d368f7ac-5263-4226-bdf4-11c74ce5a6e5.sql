
-- 1. Create a secure function to check superadmin status
-- Superadmins are admins who also have a specific user_role entry
-- For now, we use a dedicated function that checks if user is admin AND has no doctor_id (the existing super-admin pattern)
-- but wrapped in an explicit function for clarity
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM public.doctors WHERE user_id = _user_id AND is_active = true
    );
$$;

-- 2. Fix RLS policies: replace NULL fallback with explicit is_superadmin check
-- clinics
DROP POLICY IF EXISTS "Admins can manage their clinics" ON public.clinics;
CREATE POLICY "Admins can manage their clinics"
  ON public.clinics FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  );

-- schedules
DROP POLICY IF EXISTS "Admins can manage their schedules" ON public.schedules;
CREATE POLICY "Admins can manage their schedules"
  ON public.schedules FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  );

-- appointments
DROP POLICY IF EXISTS "Admins can manage their appointments" ON public.appointments;
CREATE POLICY "Admins can manage their appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  );

-- site_settings
DROP POLICY IF EXISTS "Admins can manage their settings" ON public.site_settings;
CREATE POLICY "Admins can manage their settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  );

-- consultation_requests  
DROP POLICY IF EXISTS "Admins can manage their consultations" ON public.consultation_requests;
CREATE POLICY "Admins can manage their consultations"
  ON public.consultation_requests FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND (
      doctor_id = get_doctor_id_for_user(auth.uid())
      OR is_superadmin(auth.uid())
    )
  );

-- 3. Fix storage policies: restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can upload doctor images" ON storage.objects;
CREATE POLICY "Admins can upload doctor images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'doctor-images' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can update doctor images" ON storage.objects;
CREATE POLICY "Admins can update doctor images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'doctor-images' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can delete doctor images" ON storage.objects;
CREATE POLICY "Admins can delete doctor images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'doctor-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Add DB-level input validation constraints
ALTER TABLE public.consultation_requests
  ADD CONSTRAINT full_name_valid CHECK (length(trim(full_name)) >= 2 AND length(full_name) <= 100),
  ADD CONSTRAINT phone_valid CHECK (length(trim(phone)) >= 10 AND length(phone) <= 20),
  ADD CONSTRAINT message_length CHECK (message IS NULL OR length(message) <= 2000);

ALTER TABLE public.appointments
  ADD CONSTRAINT patient_name_valid CHECK (length(trim(patient_name)) >= 2 AND length(patient_name) <= 100),
  ADD CONSTRAINT patient_phone_valid CHECK (length(trim(patient_phone)) >= 10 AND length(patient_phone) <= 20),
  ADD CONSTRAINT notes_length CHECK (notes IS NULL OR length(notes) <= 2000);
