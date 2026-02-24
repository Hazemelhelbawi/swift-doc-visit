import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDoctorSlug } from "@/hooks/useDoctorSlug";
import { useDoctorProfile } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  const { buildPath } = useDoctorSlug();
  const { data: doctorProfile } = useDoctorProfile();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  +
                </span>
              </div>
              <span className="font-heading font-bold text-xl">Dr. Care</span>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">
              {t("footer.quickLinks")}
            </h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link
                to={buildPath("/about")}
                className="hover:text-primary transition-colors"
              >
                {t("nav.about")}
              </Link>
              <Link
                to={buildPath("/services")}
                className="hover:text-primary transition-colors"
              >
                {t("nav.services")}
              </Link>
              <Link
                to={buildPath("/clinics")}
                className="hover:text-primary transition-colors"
              >
                {t("nav.clinics")}
              </Link>
              <Link
                to={buildPath("/book")}
                className="hover:text-primary transition-colors"
              >
                {t("nav.book")}
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">
              {t("footer.contactInfo")}
            </h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span dir="ltr">
                  {doctorProfile?.contact_phone || "+1 (555) 123-4567"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>
                  {doctorProfile?.contact_email || "contact@drcare.com"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  {isArabic
                    ? doctorProfile?.contact_address_ar ||
                      "123 Medical Center Dr."
                    : doctorProfile?.contact_address ||
                      "123 Medical Center Dr."}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">
              {t("contact.info.hours")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? doctorProfile?.working_hours_ar ||
                  t("contact.info.hoursValue")
                : doctorProfile?.working_hours || t("contact.info.hoursValue")}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-muted-foreground/20 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Dr. Care. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
};
