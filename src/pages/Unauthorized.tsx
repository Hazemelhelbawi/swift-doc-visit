import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Unauthorized() {
  const { isAdmin, user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {isAr ? "غير مصرح بالوصول" : "Not authorized"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isAr
            ? "ليس لديك صلاحية الوصول لهذه الصفحة."
            : "You don't have permission to access this page."}
        </p>
        <div className="flex gap-3 justify-center">
          {isAdmin ? (
            <Button asChild>
              <Link to="/admin">{isAr ? "لوحة التحكم" : "Go to Dashboard"}</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/">{isAr ? "الصفحة الرئيسية" : "Go Home"}</Link>
            </Button>
          )}
          {!user && (
            <Button asChild variant="outline">
              <Link to="/auth">{isAr ? "تسجيل الدخول" : "Log in"}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
