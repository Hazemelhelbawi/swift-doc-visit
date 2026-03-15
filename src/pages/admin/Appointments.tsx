import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctor } from '@/contexts/DoctorContext';
import type { Database } from '@/integrations/supabase/types';

type AppointmentStatus = Database['public']['Enums']['appointment_status'];

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  schedules?: {
    date: string;
    start_time: string;
    end_time: string;
    clinics?: { name: string; name_ar: string | null };
  };
}

export default function AdminAppointments() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { doctorId } = useDoctor();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['admin-appointments', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, schedules(date, start_time, end_time, clinics(name, name_ar))')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!doctorId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['recent-appointments', doctorId] });
      toast.success(t('admin.statusUpdated'));
    },
    onError: () => toast.error(t('admin.errorUpdating')),
  });

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getClinicName = (appointment: Appointment) => {
    if (!appointment.schedules?.clinics) return '-';
    return language === 'ar' && appointment.schedules.clinics.name_ar 
      ? appointment.schedules.clinics.name_ar 
      : appointment.schedules.clinics.name;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('admin.appointments')}</h2>
          <p className="text-muted-foreground">{t('admin.manageAppointments')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {t('admin.appointmentsList')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : appointments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('admin.noAppointments')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.patient')}</TableHead>
                    <TableHead>{t('admin.contact')}</TableHead>
                    <TableHead>{t('admin.clinic')}</TableHead>
                    <TableHead>{t('admin.dateTime')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.bookedOn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.patient_name}</TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${appointment.patient_phone}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {appointment.patient_phone}
                        </a>
                      </TableCell>
                      <TableCell>{getClinicName(appointment)}</TableCell>
                      <TableCell>
                        {appointment.schedules ? (
                          <div className="text-sm">
                            <div>{format(new Date(appointment.schedules.date), 'MMM dd, yyyy')}</div>
                            <div className="text-muted-foreground">
                              {formatTime(appointment.schedules.start_time)} - {formatTime(appointment.schedules.end_time)}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={appointment.status}
                          onValueChange={(value: AppointmentStatus) => 
                            updateStatusMutation.mutate({ id: appointment.id, status: value })
                          }
                        >
                          <SelectTrigger className={`w-32 ${getStatusColor(appointment.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                            <SelectItem value="confirmed">{t('admin.confirmed')}</SelectItem>
                            <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(appointment.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
