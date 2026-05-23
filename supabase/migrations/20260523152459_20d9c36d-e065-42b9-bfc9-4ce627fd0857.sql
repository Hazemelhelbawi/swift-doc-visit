-- Trial request status enum
DO $$ BEGIN
  CREATE TYPE public.trial_request_status AS ENUM ('pending','contacted','converted','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trial requests table (public leads)
CREATE TABLE IF NOT EXISTS public.trial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  specialty text,
  message text,
  status public.trial_request_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  converted_doctor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON public.trial_requests(status);
CREATE INDEX IF NOT EXISTS idx_trial_requests_created ON public.trial_requests(created_at DESC);

ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit trial request" ON public.trial_requests;
CREATE POLICY "Anyone can submit trial request"
  ON public.trial_requests FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Super-admin can manage trial requests" ON public.trial_requests;
CREATE POLICY "Super-admin can manage trial requests"
  ON public.trial_requests FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP TRIGGER IF EXISTS update_trial_requests_updated_at ON public.trial_requests;
CREATE TRIGGER update_trial_requests_updated_at
  BEFORE UPDATE ON public.trial_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add plan_type to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_type text CHECK (plan_type IN ('monthly','yearly'));