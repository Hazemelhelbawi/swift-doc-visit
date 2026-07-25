import { format } from "date-fns";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Sparkles,
  XCircle,
  Loader2,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMySubscription,
  daysRemaining,
  type SubscriptionStatus,
} from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * TEST MODE: when true, picking a plan calls activate_my_plan and instantly
 * marks the subscription active with zero payment. Flip to false only after a
 * real payment provider is wired in.
 */
const PAYMENTS_TEST_MODE = true;

const statusMeta: Record<
  SubscriptionStatus,
  { en: string; ar: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  trialing: { en: "Trial", ar: "تجريبي", variant: "secondary" },
  active: { en: "Active", ar: "نشط", variant: "default" },
  expired: { en: "Expired", ar: "منتهي", variant: "destructive" },
  lifetime_free: { en: "Lifetime", ar: "مدى الحياة", variant: "default" },
  suspended: { en: "Suspended", ar: "معلق", variant: "destructive" },
};

const plans = [
  {
    id: "monthly" as const,
    en: { title: "Monthly", period: "month", days: "30 days of full access" },
    ar: { title: "شهري", period: "شهر", days: "30 يومًا من الوصول الكامل" },
  },
  {
    id: "yearly" as const,
    en: { title: "Yearly", period: "year", days: "365 days of full access" },
    ar: { title: "سنوي", period: "سنة", days: "365 يومًا من الوصول الكامل" },
  },
];

export default function BillingPage() {
  const { data: sub, isLoading } = useMySubscription();
  const { language } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const [activating, setActivating] = useState<"monthly" | "yearly" | null>(null);

  const activate = async (plan: "monthly" | "yearly") => {
    if (!PAYMENTS_TEST_MODE) {
      toast.error(isAr ? "الدفع غير مفعل بعد" : "Payments are not enabled yet");
      return;
    }
    setActivating(plan);
    const { error } = await supabase.rpc("activate_my_plan", { _plan_type: plan });
    setActivating(null);
    if (error) {
      toast.error(isAr ? "تعذر تفعيل الخطة" : "Could not activate plan");
      return;
    }
    toast.success(isAr ? "تم تفعيل الخطة" : "Plan activated");
    qc.invalidateQueries({ queryKey: ["my-subscription"] });
  };

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {isAr ? "حساب المشرف العام" : "Super Admin Account"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "أنت تمتلك المنصة — لا يوجد اشتراك أو فوترة على حسابك."
                  : "You own the platform — no subscription or billing applies to your account."}
              </p>
              <Button asChild>
                <Link to="/admin/subscriptions">
                  {isAr ? "إدارة اشتراكات الأطباء" : "Manage doctor subscriptions"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? "الاشتراك" : "Subscription"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr
              ? "اختر خطتك وسيتم تفعيلها فورًا — بدون خطوات دفع."
              : "Pick a plan and it's activated instantly — no payment required."}
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !sub ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {isAr ? "لا يوجد اشتراك بعد." : "No subscription yet."}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {isAr ? "حالة الاشتراك" : "Subscription Status"}
              </CardTitle>
              <Badge variant={statusMeta[sub.status].variant}>
                {isAr ? statusMeta[sub.status].ar : statusMeta[sub.status].en}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {sub.status === "lifetime_free" && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    {isAr
                      ? "لديك وصول مجاني مدى الحياة."
                      : "You have lifetime free access."}
                  </span>
                </div>
              )}

              {sub.status === "trialing" && sub.trial_ends_at && (
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label={isAr ? "تنتهي الفترة التجريبية في" : "Trial ends on"}
                  value={`${format(new Date(sub.trial_ends_at), "PPP")} (${daysRemaining(sub)} ${isAr ? "يوم" : "days"})`}
                />
              )}

              {sub.status === "active" && sub.current_period_end && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label={isAr ? "ينتهي في" : "Next renewal"}
                  value={`${format(new Date(sub.current_period_end), "PPP")} (${daysRemaining(sub)} ${isAr ? "يوم" : "days"})`}
                />
              )}

              {sub.status === "expired" && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm">
                    {isAr
                      ? "اشتراكك منتهي. اختر خطة أدناه للتفعيل."
                      : "Your subscription has expired. Pick a plan below to reactivate."}
                  </span>
                </div>
              )}

              {sub.last_payment_date && (
                <Row
                  icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
                  label={isAr ? "آخر تفعيل" : "Last activation"}
                  value={format(new Date(sub.last_payment_date), "PPP")}
                />
              )}
            </CardContent>
          </Card>
        )}

        {sub?.status !== "lifetime_free" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((p) => {
              const meta = isAr ? p.ar : p.en;
              const isCurrent = sub?.status === "active" && (sub as any).plan_type === p.id;
              return (
                <Card key={p.id} className={isCurrent ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {meta.title}
                      </span>
                      {isCurrent && (
                        <Badge variant="default">{isAr ? "الحالية" : "Current"}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{meta.days}</p>
                    <Button
                      className="w-full"
                      disabled={activating !== null || isCurrent}
                      onClick={() => activate(p.id)}
                    >
                      {activating === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        isAr ? "خطتك الحالية" : "Your current plan"
                      ) : isAr ? (
                        `تفعيل ${meta.title}`
                      ) : (
                        `Activate ${meta.title}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
