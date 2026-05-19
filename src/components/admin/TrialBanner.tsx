import { AlertCircle, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  useMySubscription,
  daysRemaining,
} from "@/hooks/useSubscription";
import { useDoctorSlug } from "@/hooks/useDoctorSlug";
import { useLanguage } from "@/contexts/LanguageContext";

export function TrialBanner() {
  const { data: sub } = useMySubscription();
  const { buildPath } = useDoctorSlug();
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!sub) return null;

  if (sub.status === "lifetime_free") {
    return (
      <Alert className="mb-4 border-primary/30 bg-primary/5">
        <Crown className="h-4 w-4 text-primary" />
        <AlertTitle>{isAr ? "وصول مدى الحياة" : "Lifetime Access"}</AlertTitle>
        <AlertDescription>
          {isAr
            ? "تم منحك حق الوصول المجاني مدى الحياة. استمتع بجميع المزايا."
            : "You've been granted lifetime free access. Enjoy all features."}
        </AlertDescription>
      </Alert>
    );
  }

  const days = daysRemaining(sub);

  if (sub.status === "trialing") {
    const urgent = days <= 7;
    return (
      <Alert
        className={`mb-4 ${urgent ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}
      >
        <Sparkles
          className={`h-4 w-4 ${urgent ? "text-destructive" : "text-primary"}`}
        />
        <AlertTitle>
          {isAr ? "النسخة التجريبية المجانية" : "Free Trial"}
        </AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            {isAr
              ? `متبقي ${days} يوم${days === 1 ? "" : "ًا"} من فترتك التجريبية.`
              : `${days} day${days === 1 ? "" : "s"} left in your trial.`}
          </span>
          <Button asChild size="sm" variant={urgent ? "destructive" : "default"}>
            <Link to={buildPath("/admin/billing")}>
              {isAr ? "اشترك الآن" : "Subscribe now"}
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (sub.status === "active") {
    if (days > 10) return null;
    return (
      <Alert className="mb-4 border-amber-500/40 bg-amber-500/5">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle>
          {isAr ? "تجديد قريب" : "Renewal coming up"}
        </AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            {isAr
              ? `ينتهي اشتراكك خلال ${days} يوم${days === 1 ? "" : "ًا"}.`
              : `Your subscription ends in ${days} day${days === 1 ? "" : "s"}.`}
          </span>
          <Button asChild size="sm">
            <Link to={buildPath("/admin/billing")}>
              {isAr ? "إدارة" : "Manage"}
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
