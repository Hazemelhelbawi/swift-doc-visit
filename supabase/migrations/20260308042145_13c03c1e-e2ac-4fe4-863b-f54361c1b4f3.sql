
-- Create a security definer function to look up doctors by slug without exposing email
CREATE OR REPLACE FUNCTION public.get_doctor_by_slug(p_slug text)
RETURNS TABLE(id uuid, slug text, user_id uuid, is_active boolean, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT d.id, d.slug, d.user_id, d.is_active, d.created_at, d.updated_at
  FROM public.doctors d
  WHERE d.slug = p_slug AND d.is_active = true
  LIMIT 1;
$$;

-- Replace the public SELECT policy: only authenticated users can directly query
DROP POLICY IF EXISTS "Anyone can view active doctors" ON public.doctors;
CREATE POLICY "Authenticated can view active doctors"
  ON public.doctors FOR SELECT
  TO authenticated
  USING (is_active = true);
