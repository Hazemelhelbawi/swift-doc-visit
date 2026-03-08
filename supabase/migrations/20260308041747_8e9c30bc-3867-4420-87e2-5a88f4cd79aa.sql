
-- Create a public view excluding the email column
CREATE VIEW public.doctors_public
WITH (security_invoker = on) AS
SELECT id, slug, user_id, is_active, created_at, updated_at
FROM public.doctors;

-- Replace the public SELECT policy to deny unauthenticated direct access
DROP POLICY IF EXISTS "Anyone can view active doctors" ON public.doctors;
CREATE POLICY "Anyone can view active doctors via view"
  ON public.doctors FOR SELECT
  USING (is_active = true);
