import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Clock, Shield, Heart, Star, Users, ArrowRight, Stethoscope, Activity, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctorProfile, useHeroContent, useServicesContent } from '@/hooks/useSiteSettings';
import { useDoctorSlug } from '@/hooks/useDoctorSlug';
import { Loader2 } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Activity,
  Pill,
};

const Index = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { buildPath } = useDoctorSlug();
  const isArabic = language === 'ar';

  const { data: doctorProfile, isLoading: loadingDoctor } = useDoctorProfile();
  const { data: heroContent, isLoading: loadingHero } = useHeroContent();
  const { data: servicesContent, isLoading: loadingServices } = useServicesContent();

  const isLoading = loadingDoctor || loadingHero || loadingServices;

  // Use data from settings or fallback to defaults
  const doctorName = isArabic ? doctorProfile?.name_ar : doctorProfile?.name || 'Dr. Sarah Mitchell';
  const specialty = isArabic ? doctorProfile?.specialty_ar : doctorProfile?.specialty || 'Internal Medicine Specialist';
  const heroTitle = isArabic ? heroContent?.title_ar : heroContent?.title || t('hero.title');
  const heroSubtitle = isArabic ? heroContent?.subtitle_ar : heroContent?.subtitle || t('hero.subtitle');
  const heroTagline = isArabic ? heroContent?.tagline_ar : heroContent?.tagline || 'Compassionate Healthcare';

  const stats = [
    { value: `${doctorProfile?.experience_years || 15}+`, label: t('hero.experience'), icon: Clock },
    { value: `${doctorProfile?.patients_count || 5000}+`, label: t('hero.patients'), icon: Users },
    { value: doctorProfile?.rating?.toString() || '4.9', label: t('hero.rating'), icon: Star },
  ];

  const features = [
    { icon: Calendar, title: t('features.easyBooking') || 'Easy Booking', desc: t('features.easyBookingDesc') || 'Book appointments online in minutes' },
    { icon: Shield, title: t('features.trustedCare') || 'Trusted Care', desc: t('features.trustedCareDesc') || 'Board-certified physician with years of experience' },
    { icon: Heart, title: t('features.patientFirst') || 'Patient First', desc: t('features.patientFirstDesc') || 'Personalized care tailored to your needs' },
  ];

  // Use services from settings
  const services = servicesContent?.items?.slice(0, 3).map(item => ({
    icon: iconMap[item.icon] || Stethoscope,
    title: isArabic ? item.title_ar : item.title,
    desc: isArabic ? item.description_ar : item.description,
  })) || [
    { icon: Stethoscope, title: t('services.generalCheckup'), desc: t('services.generalCheckupDesc') },
    { icon: Activity, title: t('services.chronicCare'), desc: t('services.chronicCareDesc') },
    { icon: Pill, title: t('services.preventive'), desc: t('services.preventiveDesc') },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Heart className="h-4 w-4" />
                <span>{heroTagline}</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {heroTitle}
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                {heroSubtitle}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to={buildPath('/book')}>
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                    {t('hero.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to={buildPath('/about')}>
                  <Button size="lg" variant="outline">
                    {t('hero.ctaSecondary')}
                  </Button>
                </Link>
              </div>

              <div className="flex gap-8 pt-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-card rounded-3xl shadow-2xl overflow-hidden">
                  {heroContent?.image_url || doctorProfile?.image_url ? (
                    <img 
                      src={heroContent?.image_url || doctorProfile?.image_url}
                      alt={doctorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <Stethoscope className="h-16 w-16 text-primary" />
                        </div>
                        <h3 className="font-heading text-xl font-semibold">{doctorName}</h3>
                        <p className="text-muted-foreground">{specialty}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">{t('services.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('services.description')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary flex items-center justify-center mb-6 transition-colors">
                  <service.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground">{service.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={buildPath('/services')}>
              <Button variant="outline" size="lg" className="gap-2">
                {t('common.viewAll') || 'View All Services'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              {t('cta.title') || 'Ready to Take Control of Your Health?'}
            </h2>
            <p className="text-primary-foreground/80">
              {t('cta.subtitle') || 'Book your appointment today and experience personalized healthcare that puts you first.'}
            </p>
            <Link to={buildPath('/book')}>
              <Button size="lg" variant="secondary" className="gap-2">
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
