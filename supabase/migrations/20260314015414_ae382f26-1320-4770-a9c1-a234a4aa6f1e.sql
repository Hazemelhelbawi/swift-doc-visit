ALTER POLICY "Admins can manage their appointments"
ON public.appointments
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    doctor_id = get_doctor_id_for_user(auth.uid())
    OR get_doctor_id_for_user(auth.uid()) IS NULL
  )
);