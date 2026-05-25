
-- 1) Fix: Doctor email addresses publicly readable
-- Revoke anonymous column-level access to the email column. Authenticated
-- doctors and admins still pass via RLS, and only the email column is hidden
-- from anonymous public visitors.
REVOKE SELECT (email) ON public.doctors FROM anon;

-- 2) Fix: Site settings exposed to public with USING(true)
-- Scope public reads to settings that belong to an active doctor only.
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Public can view active doctor settings"
ON public.site_settings
FOR SELECT
USING (
  doctor_id IS NOT NULL
  AND doctor_id IN (SELECT id FROM public.doctors WHERE is_active = true)
);

-- 3) Fix: is_superadmin logic flaw (admin without doctor record = superadmin)
-- Replace implicit detection with an explicit allow-list table.
CREATE TABLE IF NOT EXISTS public.superadmins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can read superadmins" ON public.superadmins;
CREATE POLICY "Superadmins can read superadmins"
ON public.superadmins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.superadmins s WHERE s.user_id = auth.uid()));

-- Seed: migrate current implicit superadmins (admin role + no active doctor)
INSERT INTO public.superadmins (user_id)
SELECT DISTINCT ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.user_id = ur.user_id AND d.is_active = true
  )
ON CONFLICT (user_id) DO NOTHING;

-- Replace is_superadmin to use the explicit allow-list
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.superadmins WHERE user_id = _user_id);
$$;
