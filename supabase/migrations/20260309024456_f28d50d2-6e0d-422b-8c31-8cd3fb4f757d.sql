
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- ========== CLINICS ==========
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;
DROP POLICY IF EXISTS "Doctors can manage their own clinics" ON public.clinics;

CREATE POLICY "Anyone can view active clinics" ON public.clinics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Doctors can manage their own clinics" ON public.clinics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ========== SCHEDULES ==========
DROP POLICY IF EXISTS "Anyone can view active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Doctors can manage their own schedules" ON public.schedules;

CREATE POLICY "Anyone can view active schedules" ON public.schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Doctors can manage their own schedules" ON public.schedules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ========== APPOINTMENTS ==========
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

-- ========== CONSULTATION REQUESTS ==========
DROP POLICY IF EXISTS "Anyone can create consultation for active doctor" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can manage their own consultations" ON public.consultation_requests;

CREATE POLICY "Anyone can create consultation for active doctor" ON public.consultation_requests
  FOR INSERT
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE is_active = true));

CREATE POLICY "Doctors can manage their own consultations" ON public.consultation_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ========== SITE SETTINGS ==========
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can manage their own settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their own settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- ========== USER ROLES ==========
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ========== PROFILES ==========
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

-- ========== DOCTORS ==========
DROP POLICY IF EXISTS "Admins can manage all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view their own record" ON public.doctors;

CREATE POLICY "Admins can manage all doctors" ON public.doctors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can view their own record" ON public.doctors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ========== RECREATE TRIGGERS ==========
DROP TRIGGER IF EXISTS set_clinic_doctor_id ON public.clinics;
DROP TRIGGER IF EXISTS set_schedule_doctor_id ON public.schedules;
DROP TRIGGER IF EXISTS set_appointment_doctor_id_admin ON public.appointments;

CREATE OR REPLACE FUNCTION public.set_doctor_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.doctor_id := get_doctor_id_for_user(auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_clinic_doctor_id BEFORE INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION set_doctor_id_on_insert();

CREATE TRIGGER set_schedule_doctor_id BEFORE INSERT ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION set_doctor_id_on_insert();

CREATE TRIGGER set_appointment_doctor_id_admin BEFORE INSERT ON public.appointments
  FOR EACH ROW WHEN (NEW.doctor_id IS NULL)
  EXECUTE FUNCTION set_doctor_id_on_insert();
