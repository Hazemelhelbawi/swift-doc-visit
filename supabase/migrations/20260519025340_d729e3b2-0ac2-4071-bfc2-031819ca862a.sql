-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'expired', 'lifetime_free', 'suspended');

-- Subscriptions table (one row per doctor)
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL UNIQUE,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamp with time zone,
  current_period_end timestamp with time zone,
  last_payment_date timestamp with time zone,
  last_payment_amount numeric(10,2),
  payment_method text,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (doctor_id = public.get_doctor_id_for_user(auth.uid()));

CREATE POLICY "Super-admin can manage all subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create 30-day trial when a new doctor is added
CREATE OR REPLACE FUNCTION public.create_doctor_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (doctor_id, status, trial_ends_at)
  VALUES (NEW.id, 'trialing', now() + interval '30 days')
  ON CONFLICT (doctor_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER doctors_create_trial_trigger
AFTER INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.create_doctor_trial();

-- Helper: does doctor currently have active access?
CREATE OR REPLACE FUNCTION public.has_active_subscription(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE doctor_id = _doctor_id
      AND (
        status = 'lifetime_free'
        OR (status = 'trialing' AND trial_ends_at > now())
        OR (status = 'active' AND current_period_end > now())
      )
  );
$$;

-- Backfill: give every existing doctor a 30-day trial
INSERT INTO public.subscriptions (doctor_id, status, trial_ends_at)
SELECT id, 'trialing', now() + interval '30 days'
FROM public.doctors
WHERE id NOT IN (SELECT doctor_id FROM public.subscriptions);