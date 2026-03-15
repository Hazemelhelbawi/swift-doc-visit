
-- ============================================
-- FIX: Convert ALL policies to PERMISSIVE
-- ============================================

-- CLINICS: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;
DROP POLICY IF EXISTS "Doctors can manage their own clinics" ON public.clinics;

CREATE POLICY "Anyone can view active clinics" ON public.clinics
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage their clinics" ON public.clinics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- SCHEDULES: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Anyone can view active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Doctors can manage their own schedules" ON public.schedules;

CREATE POLICY "Anyone can view active schedules" ON public.schedules
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage their schedules" ON public.schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- APPOINTMENTS: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Doctors can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;

CREATE POLICY "Admins can manage their appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SITE_SETTINGS: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can manage their own settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage their settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- CONSULTATION_REQUESTS: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Anyone can create consultation for active doctor" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can manage their own consultations" ON public.consultation_requests;

CREATE POLICY "Anyone can create consultation" ON public.consultation_requests
  FOR INSERT TO public
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE is_active = true));

CREATE POLICY "Admins can manage their consultations" ON public.consultation_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- DOCTORS: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Public can view active doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view their own record" ON public.doctors;
DROP POLICY IF EXISTS "Admins can manage all doctors" ON public.doctors;

CREATE POLICY "Public can view active doctors" ON public.doctors
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Doctors can view own record" ON public.doctors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- USER_ROLES: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- PROFILES: Drop restrictive, create permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- FIX: Re-create triggers for auto doctor_id
-- ============================================
DROP TRIGGER IF EXISTS set_doctor_id_clinics ON public.clinics;
CREATE TRIGGER set_doctor_id_clinics
  BEFORE INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_doctor_id_on_insert();

DROP TRIGGER IF EXISTS set_doctor_id_schedules ON public.schedules;
CREATE TRIGGER set_doctor_id_schedules
  BEFORE INSERT ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_doctor_id_on_insert();

DROP TRIGGER IF EXISTS set_doctor_id_appointments ON public.appointments;
CREATE TRIGGER set_doctor_id_appointments
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_doctor_id_on_insert();

DROP TRIGGER IF EXISTS set_doctor_id_site_settings ON public.site_settings;
CREATE TRIGGER set_doctor_id_site_settings
  BEFORE INSERT ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_doctor_id_on_insert();
