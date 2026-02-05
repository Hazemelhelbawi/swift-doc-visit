-- Fix multi-tenant site_settings uniqueness (allow same key per doctor)
-- Previously key was globally unique, causing 23505 on inserts for other doctors.

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_key_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_settings_key_doctor_id_key'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_key_doctor_id_key UNIQUE (key, doctor_id);
  END IF;
END $$;