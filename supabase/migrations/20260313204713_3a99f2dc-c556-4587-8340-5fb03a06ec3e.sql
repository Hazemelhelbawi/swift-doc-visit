-- Make slug lookup case-insensitive so ?doctor=Asmaa... and ?doctor=asmaa... resolve to the same doctor
CREATE OR REPLACE FUNCTION public.get_doctor_by_slug(p_slug text)
RETURNS TABLE(
  id uuid,
  slug text,
  user_id uuid,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT d.id, d.slug, d.user_id, d.is_active, d.created_at, d.updated_at
  FROM public.doctors d
  WHERE lower(d.slug) = lower(p_slug)
    AND d.is_active = true
  LIMIT 1;
$function$;

-- Allow doctor-admins to manage their own records, and allow unassigned admin users (super admins)
-- to manage records for any doctor selected in dashboard via doctor_id scope.
ALTER POLICY "Admins can manage their settings"
ON public.site_settings
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
);

ALTER POLICY "Admins can manage their clinics"
ON public.clinics
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
);

ALTER POLICY "Admins can manage their schedules"
ON public.schedules
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
);