import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  specialty: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export default function StartTrial() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    specialty: "",
    message: "",
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(isAr ? "تحقق من البيانات المدخلة" : "Please check your input");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("trial_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        specialty: parsed.data.specialty || null,
        message: parsed.data.message || null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">
              {isAr ? "تم الاستلام!" : "Request received!"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "شكراً. سيتواصل معك فريقنا قريباً لتفعيل حسابك وبدء التجربة المجانية لمدة 30 يوم."
                : "Thanks! Our team will reach out shortly to activate your account and start your 30-day free trial."}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">{isAr ? "العودة للرئيسية" : "Back to home"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-md mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/">
            <ArrowLeft className={`h-4 w-4 ${isAr ? "ml-2 rotate-180" : "mr-2"}`} />
            {isAr ? "رجوع" : "Back"}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "ابدأ تجربتك المجانية" : "Start your free trial"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr
                ? "املأ البيانات وسنفعّل حسابك خلال 24 ساعة. 30 يوم مجاناً، بدون بطاقة ائتمان."
                : "Fill in your details and we'll activate your account within 24 hours. 30 days free, no card needed."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label={isAr ? "الاسم الكامل" : "Full name"} required>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder={isAr ? "د. أحمد علي" : "Dr. Ahmed Ali"}
                />
              </Field>
              <Field label={isAr ? "البريد الإلكتروني" : "Email"} required>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@example.com"
                />
              </Field>
              <Field label={isAr ? "رقم الجوال" : "Mobile"} required>
                <Input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+20 100 000 0000"
                />
              </Field>
              <Field label={isAr ? "التخصص" : "Specialty"}>
                <Input
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder={isAr ? "طب الأسنان" : "Dentistry"}
                />
              </Field>
              <Field label={isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}>
                <Textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={isAr ? "أخبرنا أكثر عن عيادتك" : "Tell us a bit about your clinic"}
                />
              </Field>
              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAr ? "إرسال الطلب" : "Submit request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
