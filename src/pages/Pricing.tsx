import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Pricing() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const features = isAr
    ? [
        "صفحة عامة احترافية بعنوان مخصص",
        "حجز المواعيد عبر الإنترنت",
        "إدارة العيادات والجداول",
        "نظام طلبات الاستشارة",
        "دعم العربية والإنجليزية",
        "تخصيص الألوان والشعار",
        "دعم فني",
      ]
    : [
        "Professional public page with custom slug",
        "Online appointment booking",
        "Manage clinics and schedules",
        "Consultation request system",
        "English & Arabic support",
        "Custom branding and colors",
        "Technical support",
      ];

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            {isAr ? "الأسعار" : "Pricing"}
          </h1>
          <p className="text-muted-foreground">
            {isAr
              ? "ابدأ بـ 30 يوم تجربة مجانية. ادفع فقط عند الاستعداد."
              : "Start with a 30-day free trial. Pay only when you're ready."}
          </p>
        </div>

        <Card className="border-primary/40 shadow-lg">
          <CardHeader className="text-center">
            <div className="text-sm font-semibold text-primary uppercase tracking-wide">
              {isAr ? "الخطة الاحترافية" : "Professional Plan"}
            </div>
            <CardTitle className="text-5xl font-bold mt-2">
              200 LE
              <span className="text-base font-normal text-muted-foreground ml-2">
                / {isAr ? "شهر" : "month"}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              {isAr
                ? "30 يوم تجربة مجانية، بدون بطاقة ائتمان"
                : "30-day free trial, no credit card required"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="w-full">
              <Link to="/auth">
                {isAr ? "ابدأ التجربة المجانية" : "Start Free Trial"}
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {isAr
                ? "للاشتراك، يقوم المشرف بإنشاء حسابك. تواصل معنا للبدء."
                : "Accounts are created by the admin. Contact us to get started."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
