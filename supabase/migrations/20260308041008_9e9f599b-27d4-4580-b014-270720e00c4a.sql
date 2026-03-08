
-- Make doctor_id NOT NULL on consultation_requests
ALTER TABLE public.consultation_requests ALTER COLUMN doctor_id SET NOT NULL;

-- Replace permissive INSERT policy with one that validates doctor_id
DROP POLICY IF EXISTS "Anyone can create consultation request" ON public.consultation_requests;
CREATE POLICY "Anyone can create consultation for active doctor"
  ON public.consultation_requests FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE is_active = true)
  );
