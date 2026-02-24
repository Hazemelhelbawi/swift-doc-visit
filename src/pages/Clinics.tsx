import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, ArrowRight, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctor } from '@/contexts/DoctorContext';

const Clinics = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const { doctor, doctorId, isLoading: isDoctorLoading } = useDoctor();

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['clinics', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('is_active', true)
        .eq('doctor_id', doctorId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-primary font-medium">{t('clinics.subtitle')}</span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mt-2 mb-6">
              {t('clinics.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('clinics.description')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Clinics Grid */}
      <section className="py-20">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : clinics && clinics.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {clinics.map((clinic, i) => (
                <motion.div
                  key={clinic.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Building2 className="h-20 w-20 text-primary/30" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-semibold mb-4">
                      {language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {language === 'ar' && clinic.address_ar ? clinic.address_ar : clinic.address}
                        </span>
                      </div>
                      {clinic.phone && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="text-sm" dir="ltr">{clinic.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">Sun - Thu: 9:00 AM - 6:00 PM</span>
                      </div>
                    </div>

                    <Link to={`/book?clinic=${clinic.id}${doctor?.slug ? `&doctor=${doctor.slug}` : ''}`}>
                      <Button className="w-full gap-2">
                        {t('clinics.viewSchedule')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground">
                {t('clinics.noClinicData')}
              </h3>
            </motion.div>
          )}
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl overflow-hidden border border-border"
          >
            <div className="h-96 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-muted-foreground">Interactive Map Coming Soon</h3>
                <p className="text-sm text-muted-foreground/70 mt-2">Find directions to our clinics</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Clinics;
