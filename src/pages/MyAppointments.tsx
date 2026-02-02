import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, FileText, CalendarPlus, Building2, Edit2, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isAfter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  clinic: {
    id: string;
    name: string;
    name_ar: string | null;
    address: string;
    address_ar: string | null;
  } | null;
  schedule: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  } | null;
}

const MyAppointments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({ patient_name: '', patient_phone: '', notes: '' });

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
      return data as Appointment[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; patient_name: string; patient_phone: string; notes: string | null }) => {
      const { error } = await supabase
        .from('appointments')
        .update({
          patient_name: data.patient_name,
          patient_phone: data.patient_phone,
          notes: data.notes,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      setEditingAppointment(null);
      toast.success(t('myAppointments.updateSuccess'));
    },
    onError: () => {
      toast.error(t('myAppointments.updateError'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
      setCancellingAppointment(null);
      toast.success(t('myAppointments.cancelSuccess'));
    },
    onError: () => {
      toast.error(t('myAppointments.cancelError'));
    },
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

  const canModify = (appointment: Appointment) => {
    if (appointment.status === 'cancelled') return false;
    if (!appointment.schedule?.date) return false;
    const appointmentDate = parseISO(appointment.schedule.date);
    return isAfter(appointmentDate, new Date());
  };

  const handleEdit = (appointment: Appointment) => {
    setEditForm({
      patient_name: appointment.patient_name,
      patient_phone: appointment.patient_phone,
      notes: appointment.notes || '',
    });
    setEditingAppointment(appointment);
  };

  const handleSaveEdit = () => {
    if (!editingAppointment) return;
    updateMutation.mutate({
      id: editingAppointment.id,
      patient_name: editForm.patient_name,
      patient_phone: editForm.patient_phone,
      notes: editForm.notes || null,
    });
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
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    {/* Header with status and actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {t(`status.${appointment.status}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {t('myAppointments.bookedOn')} {format(parseISO(appointment.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {canModify(appointment) && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(appointment)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            {t('myAppointments.edit')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setCancellingAppointment(appointment)}>
                            <X className="h-4 w-4 mr-1" />
                            {t('myAppointments.cancel')}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Appointment details */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {language === 'ar' && appointment.clinic?.name_ar 
                            ? appointment.clinic.name_ar 
                            : appointment.clinic?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{appointment.schedule?.date && format(parseISO(appointment.schedule.date), 'EEEE, MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm" dir="ltr">
                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>
                          {appointment.schedule?.start_time?.slice(0, 5)} - {appointment.schedule?.end_time?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span dir="ltr">{appointment.patient_phone}</span>
                      </div>
                    </div>

                    {/* Address and notes */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {appointment.clinic?.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>
                            {language === 'ar' && appointment.clinic.address_ar 
                              ? appointment.clinic.address_ar 
                              : appointment.clinic.address}
                          </span>
                        </div>
                      )}
                      {appointment.notes && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{appointment.notes}</span>
                        </div>
                      )}
                    </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('myAppointments.editAppointment')}</DialogTitle>
            <DialogDescription>{t('myAppointments.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient_name">{t('booking.patientName')}</Label>
              <Input
                id="patient_name"
                value={editForm.patient_name}
                onChange={(e) => setEditForm({ ...editForm, patient_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient_phone">{t('booking.patientPhone')}</Label>
              <Input
                id="patient_phone"
                value={editForm.patient_phone}
                onChange={(e) => setEditForm({ ...editForm, patient_phone: e.target.value })}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('booking.notes')}</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAppointment(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancellingAppointment} onOpenChange={() => setCancellingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('myAppointments.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>{t('myAppointments.confirmCancelDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.no')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingAppointment && cancelMutation.mutate(cancellingAppointment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default MyAppointments;
