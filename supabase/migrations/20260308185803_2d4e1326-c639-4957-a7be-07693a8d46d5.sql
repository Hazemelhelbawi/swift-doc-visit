
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- site_settings
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can insert their own settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can update their own settings" ON public.site_settings;
DROP POLICY IF EXISTS "Doctors can delete their own settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Doctors can insert their own settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can update their own settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can delete their own settings" ON public.site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- clinics
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;
DROP POLICY IF EXISTS "Doctors can manage their own clinics" ON public.clinics;

CREATE POLICY "Anyone can view active clinics" ON public.clinics FOR SELECT USING (is_active = true);
CREATE POLICY "Doctors can manage their own clinics" ON public.clinics FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid())) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- schedules
DROP POLICY IF EXISTS "Anyone can view active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Doctors can manage their own schedules" ON public.schedules;

CREATE POLICY "Anyone can view active schedules" ON public.schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Doctors can manage their own schedules" ON public.schedules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid())) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can delete their appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view their appointments" ON public.appointments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can update their appointments" ON public.appointments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can delete their appointments" ON public.appointments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- doctors
DROP POLICY IF EXISTS "Doctors can view their own record" ON public.doctors;
DROP POLICY IF EXISTS "Admins can manage all doctors" ON public.doctors;

CREATE POLICY "Doctors can view their own record" ON public.doctors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all doctors" ON public.doctors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- consultation_requests
DROP POLICY IF EXISTS "Anyone can create consultation for active doctor" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can view their own consultations" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can update their own consultations" ON public.consultation_requests;
DROP POLICY IF EXISTS "Doctors can delete their own consultations" ON public.consultation_requests;

CREATE POLICY "Anyone can create consultation for active doctor" ON public.consultation_requests FOR INSERT WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE is_active = true));
CREATE POLICY "Doctors can view their own consultations" ON public.consultation_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can update their own consultations" ON public.consultation_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
CREATE POLICY "Doctors can delete their own consultations" ON public.consultation_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
