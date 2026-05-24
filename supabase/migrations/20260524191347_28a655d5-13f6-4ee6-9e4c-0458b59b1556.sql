
-- Payment history table
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  amount numeric NOT NULL,
  days_extended integer,
  plan_type text,
  payment_method text,
  reference text,
  proof_url text,
  notes text,
  recorded_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_payments_doctor ON public.subscription_payments(doctor_id, paid_at DESC);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super-admin manages all payments"
  ON public.subscription_payments FOR ALL
  TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Doctor reads own payments"
  ON public.subscription_payments FOR SELECT
  TO authenticated
  USING (doctor_id = public.get_doctor_id_for_user(auth.uid()));

-- Private bucket for proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Super-admin manages payment proofs"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.is_superadmin(auth.uid()))
  WITH CHECK (bucket_id = 'payment-proofs' AND public.is_superadmin(auth.uid()));

CREATE POLICY "Doctor reads own payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (storage.foldername(name))[1] = public.get_doctor_id_for_user(auth.uid())::text
  );
