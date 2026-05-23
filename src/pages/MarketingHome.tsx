import { Link } from "react-router-dom";
import {
  Calendar,
  Globe2,
  Languages,
  Palette,
  Shield,
  Sparkles,
  Stethoscope,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MarketingHome() {
  const { language, setLanguage } = useLanguage();
  const isAr = language === "ar";

  const features = isAr
    ? [
        { icon: Globe2, title: "صفحة عامة احترافية", desc: "رابط مخصص لعيادتك يمكن مشاركته مع المرضى." },
        { icon: Calendar, title: "حجز عبر الإنترنت", desc: "نظام مواعيد كامل بمواعيد متاحة تلقائياً." },
        { icon: Users, title: "إدارة المرضى", desc: "تابع الحجوزات وطلبات الاستشارة من لوحة واحدة." },
        { icon: Languages, title: "عربي + إنجليزي", desc: "موقعك بلغتين بدون إعداد إضافي." },
        { icon: Palette, title: "ألوان وشعار مخصصان", desc: "اجعل الموقع يعكس هوية عيادتك." },
        { icon: Shield, title: "آمن وموثوق", desc: "بياناتك معزولة عن بقية الأطباء بالكامل." },
      ]
    : [
        { icon: Globe2, title: "Professional public page", desc: "A clean, custom URL for your clinic to share with patients." },
        { icon: Calendar, title: "Online booking", desc: "Full appointment system with auto-generated time slots." },
        { icon: Users, title: "Patient management", desc: "Track appointments and consultation requests in one dashboard." },
        { icon: Languages, title: "English + Arabic", desc: "Bilingual site out of the box, no extra setup." },
        { icon: Palette, title: "Custom colors & branding", desc: "Make the site reflect your clinic's identity." },
        { icon: Shield, title: "Secure & private", desc: "Your data is fully isolated from other doctors." },
      ];

  const planFeatures = isAr
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
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* Top nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">
              {isAr ? "منصة الأطباء" : "Doctor Platform"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(isAr ? "en" : "ar")}
            >
              {isAr ? "English" : "العربية"}
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{isAr ? "دخول" : "Login"}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/start-trial">{isAr ? "ابدأ التجربة" : "Start Trial"}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" />
          {isAr ? "30 يوم تجربة مجانية" : "30-day free trial"}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight max-w-3xl mx-auto">
          {isAr
            ? "موقع احترافي لعيادتك في دقائق"
            : "A professional website for your clinic in minutes"}
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
          {isAr
            ? "اقبل المواعيد عبر الإنترنت، أدر عياداتك، وقدّم تجربة احترافية لمرضاك — كل ذلك من لوحة تحكم واحدة."
            : "Accept online bookings, manage your clinics, and offer your patients a polished experience — all from one dashboard."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button asChild size="lg" className="text-base">
            <Link to="/start-trial">
              {isAr ? "ابدأ التجربة المجانية" : "Start Free Trial"}
              <ArrowRight className={`h-4 w-4 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <Link to="/auth">{isAr ? "تسجيل الدخول" : "Already a doctor? Log in"}</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            {isAr ? "كل ما تحتاجه عيادتك" : "Everything your clinic needs"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isAr ? "أدوات احترافية، بدون تعقيد" : "Professional tools, zero complexity"}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-4 py-20" id="pricing">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            {isAr ? "خطط بسيطة وواضحة" : "Simple, transparent pricing"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isAr ? "ابدأ مجاناً، ادفع عندما تكون جاهزاً" : "Start free, pay when ready"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <PriceCard
            badge={isAr ? "الأكثر شيوعاً" : "Most popular"}
            highlight
            title={isAr ? "شهري" : "Monthly"}
            price="200"
            unit={isAr ? "/ شهر" : "/ month"}
            features={planFeatures}
            isAr={isAr}
          />
          <PriceCard
            title={isAr ? "سنوي" : "Yearly"}
            price="2000"
            unit={isAr ? "/ سنة" : "/ year"}
            note={isAr ? "وفّر 400 ج.م سنوياً" : "Save 400 LE / year"}
            features={planFeatures}
            isAr={isAr}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {isAr
            ? "كل الخطط تبدأ بـ 30 يوم تجربة مجانية. لا حاجة لبطاقة ائتمان."
            : "All plans start with a 30-day free trial. No credit card required."}
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {isAr ? "منصة الأطباء" : "Doctor Platform"}
        </div>
      </footer>
    </div>
  );
}

function PriceCard({
  title, price, unit, features, isAr, highlight, badge, note,
}: {
  title: string;
  price: string;
  unit: string;
  features: string[];
  isAr: boolean;
  highlight?: boolean;
  badge?: string;
  note?: string;
}) {
  return (
    <Card className={highlight ? "border-primary shadow-lg relative" : ""}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {badge}
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground">{isAr ? "ج.م" : "LE"}</span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
        {note && <p className="text-xs text-primary font-medium mt-1">{note}</p>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full" variant={highlight ? "default" : "outline"}>
          <Link to="/start-trial">{isAr ? "ابدأ التجربة" : "Start Free Trial"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
