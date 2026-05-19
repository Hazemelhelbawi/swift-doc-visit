import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Phone,
  XCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMySubscription,
  daysRemaining,
  type SubscriptionStatus,
} from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const PRICE_LE = 200;
const ADMIN_PHONE = "+20 000 000 0000";
const ADMIN_EMAIL = "billing@example.com";

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

export default function BillingPage() {
  const { data: sub, isLoading } = useMySubscription();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6" dir={isAr ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAr ? "الفواتير والاشتراك" : "Billing & Subscription"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr
              ? "إدارة اشتراكك وعرض حالة الدفع"
              : "Manage your subscription and view payment status"}
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
                      ? "لديك وصول مجاني مدى الحياة. لا حاجة للدفع."
                      : "You have lifetime free access. No payment required."}
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
                      ? "اشتراكك منتهي. يرجى الدفع لتفعيل الحساب."
                      : "Your subscription has expired. Please pay to reactivate."}
                  </span>
                </div>
              )}

              {sub.last_payment_date && (
                <Row
                  icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
                  label={isAr ? "آخر دفعة" : "Last payment"}
                  value={`${format(new Date(sub.last_payment_date), "PPP")}${sub.last_payment_amount ? ` — ${sub.last_payment_amount} LE` : ""}`}
                />
              )}
            </CardContent>
          </Card>
        )}

        {sub?.status !== "lifetime_free" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {isAr ? "تعليمات الدفع" : "Payment Instructions"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                {PRICE_LE} LE
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  / {isAr ? "شهر" : "month"}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {isAr
                    ? "للاشتراك أو التجديد، يرجى الدفع عبر إحدى الطرق التالية ثم تواصل معنا لتفعيل اشتراكك:"
                    : "To subscribe or renew, pay via one of the methods below then contact us to activate your subscription:"}
                </p>

                <ul className="list-disc pl-5 space-y-1">
                  <li>InstaPay</li>
                  <li>Vodafone Cash</li>
                  <li>{isAr ? "تحويل بنكي" : "Bank transfer"}</li>
                  <li>{isAr ? "نقدًا" : "Cash"}</li>
                </ul>
              </div>

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">
                  {isAr ? "تواصل معنا:" : "Contact us:"}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{ADMIN_PHONE}</span>
                </div>
                <div className="text-sm text-muted-foreground">{ADMIN_EMAIL}</div>
              </div>
            </CardContent>
          </Card>
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
