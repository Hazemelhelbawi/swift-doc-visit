
-- Validate clinic ownership on schedules
CREATE OR REPLACE FUNCTION public.validate_schedule_ownership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE clinic_owner uuid;
BEGIN
  IF NEW.clinic_id IS NULL THEN RETURN NEW; END IF;
  SELECT doctor_id INTO clinic_owner FROM public.clinics WHERE id = NEW.clinic_id;
  IF clinic_owner IS NULL THEN
    RAISE EXCEPTION 'Clinic not found' USING ERRCODE = '23503';
  END IF;
  IF NEW.doctor_id IS NULL THEN
    NEW.doctor_id := clinic_owner;
  ELSIF NEW.doctor_id <> clinic_owner AND NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Clinic does not belong to this doctor' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedules_validate_ownership ON public.schedules;
CREATE TRIGGER schedules_validate_ownership
BEFORE INSERT OR UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.validate_schedule_ownership();

-- Validate schedule/clinic ownership on appointments
CREATE OR REPLACE FUNCTION public.validate_appointment_ownership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sched_doctor uuid; clinic_doctor uuid;
BEGIN
  IF NEW.schedule_id IS NOT NULL THEN
    SELECT doctor_id INTO sched_doctor FROM public.schedules WHERE id = NEW.schedule_id;
    IF sched_doctor IS NULL THEN
      RAISE EXCEPTION 'Schedule not found' USING ERRCODE = '23503';
    END IF;
    IF NEW.doctor_id IS NULL THEN
      NEW.doctor_id := sched_doctor;
    ELSIF NEW.doctor_id <> sched_doctor THEN
      RAISE EXCEPTION 'Schedule does not belong to this doctor' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF NEW.clinic_id IS NOT NULL THEN
    SELECT doctor_id INTO clinic_doctor FROM public.clinics WHERE id = NEW.clinic_id;
    IF clinic_doctor IS NULL THEN
      RAISE EXCEPTION 'Clinic not found' USING ERRCODE = '23503';
    END IF;
    IF NEW.doctor_id IS NOT NULL AND NEW.doctor_id <> clinic_doctor THEN
      RAISE EXCEPTION 'Clinic does not belong to this doctor' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_validate_ownership ON public.appointments;
CREATE TRIGGER appointments_validate_ownership
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_ownership();
