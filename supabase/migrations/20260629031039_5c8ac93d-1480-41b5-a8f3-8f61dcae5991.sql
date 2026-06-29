
-- 1) doctor-images storage: scope to admin's own folder, superadmin bypass
DROP POLICY IF EXISTS "Admins can upload doctor images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update doctor images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete doctor images" ON storage.objects;

CREATE POLICY "Admins can upload own doctor images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'doctor-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = (public.get_doctor_id_for_user(auth.uid()))::text
);

CREATE POLICY "Admins can update own doctor images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'doctor-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = (public.get_doctor_id_for_user(auth.uid()))::text
)
WITH CHECK (
  bucket_id = 'doctor-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = (public.get_doctor_id_for_user(auth.uid()))::text
);

CREATE POLICY "Admins can delete own doctor images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'doctor-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
  AND (storage.foldername(name))[1] = (public.get_doctor_id_for_user(auth.uid()))::text
);

CREATE POLICY "Superadmins manage doctor images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'doctor-images' AND public.is_superadmin(auth.uid()))
WITH CHECK (bucket_id = 'doctor-images' AND public.is_superadmin(auth.uid()));

-- 2) profiles: scope admin reads to their own patients
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view their patient profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND user_id IN (
      SELECT DISTINCT a.user_id FROM public.appointments a
      WHERE a.doctor_id = public.get_doctor_id_for_user(auth.uid())
        AND a.user_id IS NOT NULL
    )
  )
);

-- 2b) user_roles: drop cross-tenant admin read; superadmin only
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_superadmin(auth.uid()));

-- 3) Doctors table: split admin management — tenant admin = own row only; superadmin = all
DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;

CREATE POLICY "Superadmins manage all doctors"
ON public.doctors FOR ALL TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Doctor admins manage own record"
ON public.doctors FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND id = public.get_doctor_id_for_user(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  AND id = public.get_doctor_id_for_user(auth.uid())
);

-- 4) doctors.email: hide from anonymous visitors
REVOKE SELECT (email) ON public.doctors FROM anon;

-- 5) Schedule overbooking trigger
CREATE OR REPLACE FUNCTION public.check_schedule_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max integer; v_count integer;
BEGIN
  IF NEW.schedule_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;
  SELECT max_patients INTO v_max FROM public.schedules WHERE id = NEW.schedule_id;
  IF v_max IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_count FROM public.appointments
    WHERE schedule_id = NEW.schedule_id
      AND status <> 'cancelled'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Schedule is fully booked' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_schedule_capacity ON public.appointments;
CREATE TRIGGER enforce_schedule_capacity
BEFORE INSERT OR UPDATE OF schedule_id, status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.check_schedule_capacity();
