
-- Drop the problematic view
DROP VIEW IF EXISTS public.doctors_public;

-- Restore public SELECT policy (email hidden at app level)
CREATE POLICY "Anyone can view active doctors"
  ON public.doctors FOR SELECT
  USING (is_active = true);
