-- Create site_settings table for doctor info and site content
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add doctor column to clinics table
ALTER TABLE public.clinics 
ADD COLUMN doctor_name text,
ADD COLUMN doctor_name_ar text,
ADD COLUMN doctor_specialty text,
ADD COLUMN doctor_specialty_ar text;

-- Insert default doctor settings
INSERT INTO public.site_settings (key, value) VALUES 
('doctor_profile', '{
    "name": "Dr. Sarah Mitchell",
    "name_ar": "د. سارة ميتشل",
    "specialty": "Internal Medicine Specialist",
    "specialty_ar": "أخصائي الطب الباطني",
    "experience_years": 15,
    "patients_count": 5000,
    "rating": 4.9,
    "education": [
        {"degree": "M.D. in Internal Medicine", "degree_ar": "دكتوراه في الطب الباطني", "institution": "Johns Hopkins University", "institution_ar": "جامعة جونز هوبكنز", "year": "2008"},
        {"degree": "Residency in Internal Medicine", "degree_ar": "إقامة في الطب الباطني", "institution": "Mayo Clinic", "institution_ar": "مايو كلينك", "year": "2011"},
        {"degree": "Fellowship in Cardiology", "degree_ar": "زمالة أمراض القلب", "institution": "Cleveland Clinic", "institution_ar": "كليفلاند كلينك", "year": "2014"}
    ],
    "specializations": [
        {"en": "General Internal Medicine", "ar": "الطب الباطني العام"},
        {"en": "Cardiovascular Health", "ar": "صحة القلب والأوعية الدموية"},
        {"en": "Diabetes Management", "ar": "إدارة مرض السكري"},
        {"en": "Hypertension Treatment", "ar": "علاج ارتفاع ضغط الدم"},
        {"en": "Preventive Medicine", "ar": "الطب الوقائي"},
        {"en": "Geriatric Care", "ar": "رعاية المسنين"}
    ],
    "achievements": [
        {"en": "Board Certified in Internal Medicine", "ar": "شهادة البورد في الطب الباطني"},
        {"en": "Fellow of the American College of Physicians", "ar": "زميل الكلية الأمريكية للأطباء"},
        {"en": "Top Doctor Award 2020-2024", "ar": "جائزة أفضل طبيب 2020-2024"},
        {"en": "Published researcher with 20+ papers", "ar": "باحث منشور مع أكثر من 20 بحث"}
    ],
    "philosophy": "I believe that healthcare is more than just treating symptoms—it\u0027s about building lasting relationships with patients and empowering them to take control of their health through education and prevention.",
    "philosophy_ar": "أؤمن بأن الرعاية الصحية هي أكثر من مجرد علاج الأعراض - إنها بناء علاقات دائمة مع المرضى وتمكينهم من السيطرة على صحتهم من خلال التثقيف والوقاية."
}'::jsonb),
('hero_content', '{
    "tagline": "Compassionate Healthcare",
    "tagline_ar": "رعاية صحية برحمة",
    "title": "Your Health, Our Priority",
    "title_ar": "صحتك، أولويتنا",
    "subtitle": "Experience personalized healthcare with Dr. Sarah Mitchell. Book your appointment today for comprehensive medical care.",
    "subtitle_ar": "استمتع برعاية صحية مخصصة مع د. سارة ميتشل. احجز موعدك اليوم للحصول على رعاية طبية شاملة."
}'::jsonb),
('services', '{
    "items": [
        {"icon": "Stethoscope", "title": "General Check-up", "title_ar": "الفحص العام", "description": "Comprehensive health assessments to monitor your overall wellness.", "description_ar": "تقييمات صحية شاملة لمراقبة صحتك العامة."},
        {"icon": "Activity", "title": "Chronic Disease Management", "title_ar": "إدارة الأمراض المزمنة", "description": "Expert care for diabetes, hypertension, and other chronic conditions.", "description_ar": "رعاية متخصصة لمرض السكري وارتفاع ضغط الدم والحالات المزمنة الأخرى."},
        {"icon": "Pill", "title": "Preventive Care", "title_ar": "الرعاية الوقائية", "description": "Proactive health screenings and lifestyle guidance.", "description_ar": "فحوصات صحية استباقية وإرشادات نمط الحياة."},
        {"icon": "MessageSquare", "title": "Medical Consultation", "title_ar": "الاستشارة الطبية", "description": "In-depth discussions about your health concerns and treatment options.", "description_ar": "مناقشات معمقة حول مخاوفك الصحية وخيارات العلاج."},
        {"icon": "FlaskConical", "title": "Lab Tests", "title_ar": "الفحوصات المخبرية", "description": "Complete laboratory testing with quick results.", "description_ar": "فحوصات مخبرية كاملة مع نتائج سريعة."},
        {"icon": "CalendarCheck", "title": "Follow-up Care", "title_ar": "رعاية المتابعة", "description": "Regular monitoring to track your health progress.", "description_ar": "مراقبة منتظمة لتتبع تقدمك الصحي."}
    ]
}'::jsonb);