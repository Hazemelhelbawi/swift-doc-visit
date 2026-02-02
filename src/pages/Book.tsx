import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, FileText, CheckCircle, Building2, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isSameDay, addDays, eachDayOfInterval, isAfter, isBefore } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';

const bookingSchema = z.object({
  patient_name: z.string().min(2, 'Name must be at least 2 characters'),
  patient_phone: z.string().min(10, 'Please enter a valid phone number'),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const Book = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [selectedClinic, setSelectedClinic] = useState<string>(searchParams.get('clinic') || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [step, setStep] = useState<'clinic' | 'date' | 'time' | 'form' | 'success'>('clinic');

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patient_name: '',
      patient_phone: '',
      notes: '',
    },
  });

  // Fetch clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch schedules using the new function that handles recurring schedules
  const { data: availableSchedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['available-schedules', selectedClinic],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const endDate = addDays(new Date(), 60).toISOString().split('T')[0]; // Look 60 days ahead
      
      // Try to use the new function first, fallback to direct query
      const { data: functionData, error: functionError } = await supabase.rpc(
        'get_available_schedules',
        { p_clinic_id: selectedClinic, p_start_date: today, p_end_date: endDate }
      );
      
      if (!functionError && functionData) {
        return functionData as Array<{
          schedule_id: string;
          clinic_id: string;
          schedule_date: string;
          start_time: string;
          end_time: string;
          max_patients: number;
          is_recurring: boolean;
        }>;
      }
      
      // Fallback to regular query if function doesn't exist
      const { data, error } = await supabase
        .from('schedules')
        .select('id, clinic_id, date, start_time, end_time, max_patients, is_recurring')
        .eq('clinic_id', selectedClinic)
        .eq('is_active', true)
        .gte('date', today)
        .order('date')
        .order('start_time');
      
      if (error) throw error;
      
      // Map to consistent format
      return (data || []).map(s => ({
        schedule_id: s.id,
        clinic_id: s.clinic_id,
        schedule_date: s.date,
        start_time: s.start_time,
        end_time: s.end_time,
        max_patients: s.max_patients,
        is_recurring: s.is_recurring || false,
      }));
    },
    enabled: !!selectedClinic,
  });

  // Fetch booking counts for schedules
  const { data: bookingCounts } = useQuery({
    queryKey: ['bookingCounts', availableSchedules?.map(s => `${s.schedule_id}-${s.schedule_date}`)],
    queryFn: async () => {
      if (!availableSchedules) return {};
      const counts: Record<string, number> = {};
      const uniqueScheduleIds = [...new Set(availableSchedules.map(s => s.schedule_id))];
      
      for (const scheduleId of uniqueScheduleIds) {
        const { data } = await supabase.rpc('get_schedule_booking_count', { schedule_uuid: scheduleId });
        counts[scheduleId] = data || 0;
      }
      return counts;
    },
    enabled: !!availableSchedules && availableSchedules.length > 0,
  });

  // Available dates from schedules
  const availableDates = useMemo(() => {
    if (!availableSchedules) return [];
    return [...new Set(availableSchedules.map(s => s.schedule_date))].map(d => parseISO(d));
  }, [availableSchedules]);

  // Schedules for selected date
  const schedulesForDate = useMemo(() => {
    if (!availableSchedules || !selectedDate) return [];
    return availableSchedules.filter(s => isSameDay(parseISO(s.schedule_date), selectedDate));
  }, [availableSchedules, selectedDate]);

  // Auto-advance from clinic when selected
  useEffect(() => {
    if (selectedClinic && step === 'clinic') {
      setStep('date');
    }
  }, [selectedClinic, step]);

  // Book appointment mutation
  const { mutate: bookAppointment, isPending } = useMutation({
    mutationFn: async (values: BookingFormValues) => {
      if (!user || !selectedSchedule || !selectedClinic) {
        throw new Error('Missing required data');
      }
      const { error } = await supabase.from('appointments').insert([{
        user_id: user.id,
        clinic_id: selectedClinic,
        schedule_id: selectedSchedule,
        patient_name: values.patient_name,
        patient_phone: values.patient_phone,
        notes: values.notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingCounts'] });
      setStep('success');
      toast({
        title: t('booking.success'),
        description: t('booking.successMessage'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    bookAppointment(values);
  };

  const getClinicName = (clinicId: string) => {
    const clinic = clinics?.find(c => c.id === clinicId);
    if (!clinic) return '';
    return language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name;
  };

  const getSlotAvailability = (scheduleId: string, maxPatients: number) => {
    const count = bookingCounts?.[scheduleId] || 0;
    const available = maxPatients - count;
    return { count, available, isFull: available <= 0 };
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-4">{t('booking.loginRequired')}</h1>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                {t('nav.login')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-medium">{t('booking.subtitle')}</span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mt-2">
              {t('booking.title')}
            </h1>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 md:gap-4">
              {[
                { key: 'clinic', icon: Building2, label: t('booking.selectClinic') },
                { key: 'date', icon: Calendar, label: t('booking.selectDate') },
                { key: 'time', icon: Clock, label: t('booking.selectTime') },
                { key: 'form', icon: User, label: t('booking.patientInfo') },
              ].map((s, i, arr) => (
                <div key={s.key} className="flex items-center gap-2 md:gap-4">
                  <div 
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      step === s.key 
                        ? 'bg-primary text-primary-foreground' 
                        : step === 'success' || arr.slice(0, i).some(x => ['clinic', 'date', 'time', 'form'].indexOf(step) > ['clinic', 'date', 'time', 'form'].indexOf(x.key))
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && <div className="w-4 md:w-8 h-0.5 bg-border" />}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-3">{t('booking.success')}</h2>
                <p className="text-muted-foreground mb-8">{t('booking.successMessage')}</p>
                <div className="flex justify-center gap-4">
                  <Link to="/my-appointments">
                    <Button size="lg">{t('nav.myAppointments')}</Button>
                  </Link>
                  <Button variant="outline" size="lg" onClick={() => {
                    setStep('clinic');
                    setSelectedClinic('');
                    setSelectedDate(undefined);
                    setSelectedSchedule('');
                    form.reset();
                  }}>
                    {t('booking.bookAnother')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Clinic Selection */}
            {step === 'clinic' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {t('booking.selectClinic')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clinicsLoading ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
                      </div>
                    ) : clinics && clinics.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {clinics.map(clinic => {
                          const doctorName = language === 'ar' && (clinic as any).doctor_name_ar 
                            ? (clinic as any).doctor_name_ar 
                            : (clinic as any).doctor_name;
                          const doctorSpecialty = language === 'ar' && (clinic as any).doctor_specialty_ar 
                            ? (clinic as any).doctor_specialty_ar 
                            : (clinic as any).doctor_specialty;
                          
                          return (
                            <button
                              key={clinic.id}
                              onClick={() => setSelectedClinic(clinic.id)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                selectedClinic === clinic.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <h3 className="font-semibold">
                                {language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {language === 'ar' && clinic.address_ar ? clinic.address_ar : clinic.address}
                              </p>
                              {doctorName && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-sm font-medium text-primary">{doctorName}</p>
                                  {doctorSpecialty && (
                                    <p className="text-xs text-muted-foreground">{doctorSpecialty}</p>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">{t('clinics.noClinicData')}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Date Selection */}
            {step === 'date' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {t('booking.selectDate')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-sm text-muted-foreground">
                        {t('booking.selectedClinic')}: <span className="font-medium text-foreground">{getClinicName(selectedClinic)}</span>
                      </div>
                      {schedulesLoading ? (
                        <Skeleton className="h-80 w-full max-w-sm" />
                      ) : (
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) setStep('time');
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today || !availableDates.some(d => isSameDay(d, date));
                          }}
                          className="rounded-md border"
                        />
                      )}
                      <Button variant="ghost" className="mt-4" onClick={() => { setStep('clinic'); setSelectedClinic(''); }}>
                        ← {t('booking.changeClinic')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Time Selection */}
            {step === 'time' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      {t('booking.selectTime')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: language === 'ar' ? ar : enUS })}
                    </div>
                    {schedulesForDate.length > 0 ? (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {schedulesForDate.map((schedule, index) => {
                          const { available, isFull } = getSlotAvailability(schedule.schedule_id, schedule.max_patients);
                          return (
                            <button
                              key={`${schedule.schedule_id}-${schedule.schedule_date}-${index}`}
                              onClick={() => {
                                if (!isFull) {
                                  setSelectedSchedule(schedule.schedule_id);
                                  setStep('form');
                                }
                              }}
                              disabled={isFull}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                isFull
                                  ? 'border-border bg-muted/50 cursor-not-allowed opacity-50'
                                  : selectedSchedule === schedule.schedule_id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="font-semibold" dir="ltr">
                                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                              </div>
                              <div className={`text-sm mt-1 ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {isFull ? t('booking.fullyBooked') : `${available} ${t('booking.slotsAvailable')}`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">{t('booking.noSlots')}</p>
                    )}
                    <Button variant="ghost" className="mt-4" onClick={() => { setStep('date'); setSelectedDate(undefined); }}>
                      ← {t('booking.changeDate')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Patient Form */}
            {step === 'form' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {t('booking.patientInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 rounded-xl bg-muted/50 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">{t('admin.clinic')}:</span>
                        <span className="font-medium">{getClinicName(selectedClinic)}</span>
                        <span className="text-muted-foreground">{t('admin.date')}:</span>
                        <span className="font-medium">{selectedDate && format(selectedDate, 'MMM d, yyyy', { locale: language === 'ar' ? ar : enUS })}</span>
                        <span className="text-muted-foreground">{t('admin.time')}:</span>
                        <span className="font-medium" dir="ltr">
                          {schedulesForDate.find(s => s.schedule_id === selectedSchedule)?.start_time.slice(0, 5)} - 
                          {schedulesForDate.find(s => s.schedule_id === selectedSchedule)?.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="patient_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('booking.name')}</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="patient_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('booking.phone')}</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" dir="ltr" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('booking.notes')}</FormLabel>
                              <FormControl>
                                <Textarea placeholder={t('booking.notesPlaceholder')} rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-4">
                          <Button type="button" variant="outline" onClick={() => { setStep('time'); setSelectedSchedule(''); }}>
                            ← Back
                          </Button>
                          <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
                            <CheckCircle className="h-4 w-4" />
                            {isPending ? t('common.loading') : t('booking.submit')}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Book;
