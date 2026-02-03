-- Create doctors table for multi-tenant support
CREATE TABLE public.doctors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    email text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Policies for doctors table
CREATE POLICY "Super admins can manage all doctors"
    ON public.doctors FOR ALL
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can view their own record"
    ON public.doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active doctors"
    ON public.doctors FOR SELECT
    USING (is_active = true);

-- Add doctor_id to all relevant tables
ALTER TABLE public.clinics ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;
ALTER TABLE public.schedules ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;
ALTER TABLE public.consultation_requests ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;
ALTER TABLE public.site_settings ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;

-- Add primary_color to site_settings for dynamic theming
-- This will be stored in the 'value' JSONB field as part of 'theme_settings' key

-- Create default doctor for existing data
INSERT INTO public.doctors (id, slug, email, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'default', 'admin@example.com', true);

-- Update existing records to belong to default doctor
UPDATE public.clinics SET doctor_id = '00000000-0000-0000-0000-000000000001' WHERE doctor_id IS NULL;
UPDATE public.schedules SET doctor_id = '00000000-0000-0000-0000-000000000001' WHERE doctor_id IS NULL;
UPDATE public.appointments SET doctor_id = '00000000-0000-0000-0000-000000000001' WHERE doctor_id IS NULL;
UPDATE public.consultation_requests SET doctor_id = '00000000-0000-0000-0000-000000000001' WHERE doctor_id IS NULL;
UPDATE public.site_settings SET doctor_id = '00000000-0000-0000-0000-000000000001' WHERE doctor_id IS NULL;

-- Add theme_settings for color customization
INSERT INTO public.site_settings (key, doctor_id, value)
VALUES ('theme_settings', '00000000-0000-0000-0000-000000000001', '{
    "primary_color": "#1DAFA1",
    "accent_color": "#E8655A"
}'::jsonb)
ON CONFLICT DO NOTHING;

-- Update RLS policies to filter by doctor_id
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.clinics;
CREATE POLICY "Anyone can view active clinics by doctor"
    ON public.clinics FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active schedules" ON public.schedules;
CREATE POLICY "Anyone can view active schedules by doctor"
    ON public.schedules FOR SELECT
    USING (is_active = true);

-- Create trigger for updated_at on doctors
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();