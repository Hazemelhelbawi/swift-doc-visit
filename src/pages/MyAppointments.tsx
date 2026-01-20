import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, FileText, CalendarPlus, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';

const MyAppointments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['myAppointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(*),
          schedule:schedules(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">{t('booking.loginRequired')}</h1>
          <Link to="/auth">
            <Button>{t('nav.login')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl font-bold">{t('myAppointments.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('myAppointments.subtitle')}</p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment, i) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {t(`status.${appointment.status}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Booked on {format(parseISO(appointment.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span>
                            {language === 'ar' && appointment.clinic?.name_ar 
                              ? appointment.clinic.name_ar 
                              : appointment.clinic?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{appointment.schedule?.date && format(parseISO(appointment.schedule.date), 'EEEE, MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground" dir="ltr">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {appointment.schedule?.start_time?.slice(0, 5)} - {appointment.schedule?.end_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{appointment.patient_phone}</span>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="line-clamp-1">{appointment.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {appointment.clinic?.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground md:text-right">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="max-w-[200px]">
                          {language === 'ar' && appointment.clinic.address_ar 
                            ? appointment.clinic.address_ar 
                            : appointment.clinic.address}
                        </span>
                      </div>
                    )}
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
              <CalendarPlus className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">
                {t('myAppointments.noAppointments')}
              </h3>
              <Link to="/book">
                <Button className="mt-4">{t('myAppointments.bookNow')}</Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MyAppointments;
