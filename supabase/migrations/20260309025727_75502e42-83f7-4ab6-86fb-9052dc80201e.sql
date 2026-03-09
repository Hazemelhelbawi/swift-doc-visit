
-- Fix: Change all RESTRICTIVE policies to PERMISSIVE
-- PostgreSQL requires at least one PERMISSIVE policy for access; RESTRICTIVE-only = deny all

-- ============ CLINICS ============
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;
DROP POLICY IF EXISTS "Doctors can manage their own clinics" ON public.clinics;

CREATE POLICY "Anyone can view active clinics" ON public.clinics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Doctors can manage their own clinics" ON public.clinics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ SCHEDULES ============
DROP POLICY IF EXISTS "Anyone can view active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Doctors can manage their own schedules" ON public.schedules;

CREATE POLICY "Anyone can view active schedules" ON public.schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Doctors can manage their own schedules" ON public.schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ APPOINTMENTS ============
DROP POLICY IF EXISTS "Doctors can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;

CREATE POLICY "Doctors can manage their appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============ CONSULTATION_REQUESTS ============
DROP POLICY IF EXISTS "Anyone can create consultation for active doctor" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can manage their own consultations" ON public.consultation_requests;

CREATE POLICY "Anyone can create consultation for active doctor" ON public.consultation_requests
  FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE is_active = true));

CREATE POLICY "Doctors can manage their own consultations" ON public.consultation_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ SITE_SETTINGS ============
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can manage their own settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their own settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ============ DOCTORS ============
DROP POLICY IF EXISTS "Admins can manage all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view their own record" ON public.doctors;

CREATE POLICY "Admins can manage all doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can view their own record" ON public.doctors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active doctors" ON public.doctors
  FOR SELECT USING (is_active = true);
