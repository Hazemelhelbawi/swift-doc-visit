import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { useDoctor } from '@/contexts/DoctorContext';

type ConsultationStatus = Database['public']['Enums']['consultation_status'];

interface Consultation {
  id: string;
  full_name: string;
  phone: string;
  message: string | null;
  status: ConsultationStatus;
  created_at: string;
}

export default function AdminConsultations() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { doctorId } = useDoctor();

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['admin-consultations', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Consultation[];
    },
    enabled: !!doctorId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ConsultationStatus }) => {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations', doctorId] });
      toast.success(t('admin.statusUpdated'));
    },
    onError: () => toast.error(t('admin.errorUpdating')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consultation_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations', doctorId] });
      toast.success(t('admin.consultationDeleted'));
    },
    onError: () => toast.error(t('admin.errorDeleting')),
  });

  const getStatusColor = (status: ConsultationStatus) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'closed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('admin.consultations')}</h2>
          <p className="text-muted-foreground">{t('admin.manageConsultations')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('admin.consultationsList')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : consultations?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('admin.noConsultations')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.name')}</TableHead>
                    <TableHead>{t('admin.contact')}</TableHead>
                    <TableHead>{t('admin.message')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.date')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations?.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">{consultation.full_name}</TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${consultation.phone}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {consultation.phone}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {consultation.message || '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={consultation.status}
                          onValueChange={(value: ConsultationStatus) => 
                            updateStatusMutation.mutate({ id: consultation.id, status: value })
                          }
                        >
                          <SelectTrigger className={`w-32 ${getStatusColor(consultation.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">{t('admin.new')}</SelectItem>
                            <SelectItem value="contacted">{t('admin.contacted')}</SelectItem>
                            <SelectItem value="closed">{t('admin.closed')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(consultation.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(consultation.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
