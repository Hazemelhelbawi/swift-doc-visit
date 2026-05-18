-- Auto-generate unique slug for doctors
CREATE OR REPLACE FUNCTION public.slugify(_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(_text, '')), '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_doctor_slug(_base text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := public.slugify(_base);
  IF base IS NULL OR length(base) = 0 THEN
    base := 'doctor';
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.doctors WHERE slug = candidate) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.doctors_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source text;
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    source := split_part(NEW.email, '@', 1);
    NEW.slug := public.generate_unique_doctor_slug(source);
  ELSE
    -- normalize provided slug; ensure uniqueness if it changes
    NEW.slug := public.slugify(NEW.slug);
    IF NEW.slug IS NULL OR length(NEW.slug) = 0 THEN
      NEW.slug := public.generate_unique_doctor_slug(split_part(NEW.email, '@', 1));
    ELSIF EXISTS (SELECT 1 FROM public.doctors WHERE slug = NEW.slug AND id <> NEW.id) THEN
      NEW.slug := public.generate_unique_doctor_slug(NEW.slug);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS doctors_set_slug_trigger ON public.doctors;
CREATE TRIGGER doctors_set_slug_trigger
BEFORE INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.doctors_set_slug();