
-- Helper function to get the doctor_id for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_doctor_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = _user_id AND is_active = true LIMIT 1
$$;

-- ============ CLINICS ============
DROP POLICY IF EXISTS "Admins can view all clinics" ON public.clinics;
CREATE POLICY "Doctors can view their own clinics"
  ON public.clinics FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert clinics" ON public.clinics;
CREATE POLICY "Doctors can insert their own clinics"
  ON public.clinics FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update clinics" ON public.clinics;
CREATE POLICY "Doctors can update their own clinics"
  ON public.clinics FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete clinics" ON public.clinics;
CREATE POLICY "Doctors can delete their own clinics"
  ON public.clinics FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ SCHEDULES ============
DROP POLICY IF EXISTS "Admins can view all schedules" ON public.schedules;
CREATE POLICY "Doctors can view their own schedules"
  ON public.schedules FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert schedules" ON public.schedules;
CREATE POLICY "Doctors can insert their own schedules"
  ON public.schedules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update schedules" ON public.schedules;
CREATE POLICY "Doctors can update their own schedules"
  ON public.schedules FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete schedules" ON public.schedules;
CREATE POLICY "Doctors can delete their own schedules"
  ON public.schedules FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ APPOINTMENTS ============
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Doctors can view their own appointments"
  ON public.appointments FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update any appointment" ON public.appointments;
CREATE POLICY "Doctors can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Doctors can delete their own appointments"
  ON public.appointments FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ CONSULTATION REQUESTS ============
DROP POLICY IF EXISTS "Admins can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can view their own consultations"
  ON public.consultation_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can update their own consultations"
  ON public.consultation_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete consultation requests" ON public.consultation_requests;
CREATE POLICY "Doctors can delete their own consultations"
  ON public.consultation_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ SITE SETTINGS ============
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Doctors can insert their own settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Doctors can update their own settings"
  ON public.site_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;
CREATE POLICY "Doctors can delete their own settings"
  ON public.site_settings FOR DELETE
  USING (has_role(auth.uid(), 'admin') AND doctor_id = get_doctor_id_for_user(auth.uid()));
