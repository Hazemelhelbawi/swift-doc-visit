
-- Create trigger to auto-set doctor_id on insert for clinics
CREATE OR REPLACE FUNCTION public.set_doctor_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always override doctor_id with the authenticated user's doctor id
  NEW.doctor_id := get_doctor_id_for_user(auth.uid());
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_clinic_doctor_id BEFORE INSERT ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION set_doctor_id_on_insert();

CREATE TRIGGER set_schedule_doctor_id BEFORE INSERT ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION set_doctor_id_on_insert();

CREATE TRIGGER set_appointment_doctor_id_admin BEFORE INSERT ON public.appointments
  FOR EACH ROW 
  WHEN (NEW.doctor_id IS NULL)
  EXECUTE FUNCTION set_doctor_id_on_insert();
