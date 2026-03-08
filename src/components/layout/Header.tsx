import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, User, LogOut, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctorSlug } from '@/hooks/useDoctorSlug';

export const Header = () => {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { doctorSlug, buildPath } = useDoctorSlug();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    // Capture slug before sign out clears session
    const slug = doctorSlug || sessionStorage.getItem('active_doctor_slug');
    await signOut();
    // Redirect to doctor-scoped home page
    if (slug) {
      navigate(`/?doctor=${slug}`);
    } else {
      navigate('/');
    }
  }, [doctorSlug, signOut, navigate]);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/services', label: t('nav.services') },
    { path: '/clinics', label: t('nav.clinics') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to={buildPath('/')} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">+</span>
          </div>
          <span className="font-heading font-bold text-xl text-foreground">Dr. Care</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={buildPath(link.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="hidden sm:flex"
          >
            <Globe className="h-5 w-5" />
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isAdmin && (
                <Link to={buildPath('/dashboard')}>
                  <Button variant="ghost" size="sm">{t('nav.dashboard')}</Button>
                </Link>
              )}
              <Link to={buildPath('/my-appointments')}>
                <Button variant="ghost" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('nav.myAppointments')}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to={buildPath('/auth')}>
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to={buildPath('/book')}>
                <Button size="sm">{t('nav.book')}</Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <nav className="container py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={buildPath(link.path)}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium ${
                    isActive(link.path) ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2" />
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">{t('nav.dashboard')}</Button>
                    </Link>
                  )}
                  <Link to={buildPath('/my-appointments')} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t('nav.myAppointments')}</Button>
                  </Link>
                  <Button variant="ghost" onClick={handleSignOut} className="w-full">{t('nav.logout')}</Button>
                </>
              ) : (
                <>
                  <Link to={buildPath('/auth')} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">{t('nav.login')}</Button>
                  </Link>
                  <Link to={buildPath('/book')} onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">{t('nav.book')}</Button>
                  </Link>
                </>
              )}
              <Button variant="ghost" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
                <Globe className="h-5 w-5 mr-2" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
