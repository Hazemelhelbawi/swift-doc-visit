
-- Drop the ALL policy and create explicit per-operation policies for clinics
DROP POLICY IF EXISTS "Doctors can manage their own clinics" ON public.clinics;

CREATE POLICY "Doctors can select their own clinics" ON public.clinics 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can insert their own clinics" ON public.clinics 
FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can update their own clinics" ON public.clinics 
FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can delete their own clinics" ON public.clinics 
FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

-- Same fix for schedules
DROP POLICY IF EXISTS "Doctors can manage their own schedules" ON public.schedules;

CREATE POLICY "Doctors can select their own schedules" ON public.schedules 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can insert their own schedules" ON public.schedules 
FOR INSERT TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can update their own schedules" ON public.schedules 
FOR UPDATE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Doctors can delete their own schedules" ON public.schedules 
FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) AND doctor_id = get_doctor_id_for_user(auth.uid()));
