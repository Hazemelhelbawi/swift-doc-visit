
-- Replace broad authenticated policy with specific ones
DROP POLICY IF EXISTS "Authenticated can view active doctors" ON public.doctors;

-- Regular authenticated users should use the RPC function, not direct table access
-- Only doctors viewing their own record and admins need direct access (policies already exist)
