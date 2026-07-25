
CREATE OR REPLACE FUNCTION public.activate_my_plan(_plan_type text)
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doctor_id uuid;
  _days integer;
  _sub public.subscriptions;
BEGIN
  _doctor_id := public.get_doctor_id_for_user(auth.uid());
  IF _doctor_id IS NULL THEN
    RAISE EXCEPTION 'No doctor account for current user' USING ERRCODE='42501';
  END IF;

  IF _plan_type = 'monthly' THEN _days := 30;
  ELSIF _plan_type = 'yearly' THEN _days := 365;
  ELSE RAISE EXCEPTION 'Invalid plan type' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.subscriptions (doctor_id, status, current_period_end, plan_type, last_payment_date, last_payment_amount, payment_method)
  VALUES (_doctor_id, 'active', now() + (_days || ' days')::interval, _plan_type, now(), 0, 'free_activation')
  ON CONFLICT (doctor_id) DO UPDATE
    SET status = 'active',
        current_period_end = now() + (_days || ' days')::interval,
        plan_type = EXCLUDED.plan_type,
        last_payment_date = now(),
        last_payment_amount = 0,
        payment_method = 'free_activation',
        updated_at = now()
  RETURNING * INTO _sub;

  RETURN _sub;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_my_plan(text) TO authenticated;
