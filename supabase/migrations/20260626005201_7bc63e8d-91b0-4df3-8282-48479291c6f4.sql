
-- 1. Revoke public email exposure on doctors
REVOKE SELECT (email) ON public.doctors FROM anon;
REVOKE SELECT (email) ON public.doctors FROM authenticated;
GRANT SELECT (email) ON public.doctors TO authenticated;

-- 2. Scope appointment update policy to authenticated only
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Restrict user_roles writes to superadmins only
DROP POLICY IF EXISTS "Superadmins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmins can delete roles" ON public.user_roles;

CREATE POLICY "Superadmins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));
