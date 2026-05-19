import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMySubscription,
  hasActiveAccess,
} from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctor } from "@/contexts/DoctorContext";
import { useDoctorSlug } from "@/hooks/useDoctorSlug";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  children: ReactNode;
}

/**
 * Blocks access to admin pages when the doctor's subscription is expired.
 * Super-admins (admin role without a doctor record) bypass this check.
 */
export function SubscriptionGuard({ children }: Props) {
  const { user } = useAuth();
  const { doctorId } = useDoctor();
  const { buildPath } = useDoctorSlug();
  const { data: sub, isLoading } = useMySubscription();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Super-admin (no doctorId attached) bypasses paywall
  if (user && !doctorId) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasActiveAccess(sub)) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <Lock className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle>
            {isAr ? "انتهى اشتراكك" : "Your subscription has expired"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            {isAr
              ? "صفحتك العامة لا تزال نشطة، ولكن لوحة التحكم مقفلة حتى يتم تجديد الاشتراك."
              : "Your public page is still live, but the dashboard is locked until your subscription is renewed."}
          </p>
          <Button asChild className="w-full">
            <Link to={buildPath("/admin/billing")}>
              {isAr ? "عرض تعليمات الدفع" : "View payment instructions"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
