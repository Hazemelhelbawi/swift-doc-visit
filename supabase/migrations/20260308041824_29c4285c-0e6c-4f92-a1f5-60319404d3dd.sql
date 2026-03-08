
-- Drop and recreate view without security_invoker (defaults to security_definer behavior)
DROP VIEW IF EXISTS public.doctors_public;
CREATE VIEW public.doctors_public AS
SELECT id, slug, user_id, is_active, created_at, updated_at
FROM public.doctors
WHERE is_active = true;

-- Remove the open public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active doctors via view" ON public.doctors;

-- Only allow authenticated users to see their own doctor record or admins to see all
-- The view will handle public/anonymous access without exposing email
