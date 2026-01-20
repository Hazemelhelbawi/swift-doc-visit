import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">+</span>
              </div>
              <span className="font-heading font-bold text-xl">Dr. Care</span>
            </div>
            <p className="text-muted-foreground text-sm">{t('footer.description')}</p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/services" className="hover:text-primary transition-colors">{t('nav.services')}</Link>
              <Link to="/clinics" className="hover:text-primary transition-colors">{t('nav.clinics')}</Link>
              <Link to="/book" className="hover:text-primary transition-colors">{t('nav.book')}</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">{t('footer.contactInfo')}</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@drcare.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Medical Center Dr.</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">{t('contact.info.hours')}</h4>
            <p className="text-sm text-muted-foreground">{t('contact.info.hoursValue')}</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-muted-foreground/20 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Dr. Care. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
