REVOKE EXECUTE ON FUNCTION public.activate_my_plan(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_my_plan(text) TO authenticated;