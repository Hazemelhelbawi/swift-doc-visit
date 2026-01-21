import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface Schedule {
  id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  clinics?: { name: string; name_ar: string | null };
}

interface Clinic {
  id: string;
  name: string;
  name_ar: string | null;
}

export default function AdminSchedules() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    clinic_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_patients: 10,
    is_active: true,
  });

  const { data: clinics } = useQuery({
    queryKey: ['admin-clinics-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, name_ar')
        .eq('is_active', true);
      if (error) throw error;
      return data as Clinic[];
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, clinics(name, name_ar)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('schedules').insert({
        clinic_id: data.clinic_id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        max_patients: data.max_patients,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success(t('admin.scheduleCreated'));
      resetForm();
    },
    onError: () => toast.error(t('admin.errorCreating')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('schedules')
        .update({
          clinic_id: data.clinic_id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          max_patients: data.max_patients,
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success(t('admin.scheduleUpdated'));
      resetForm();
    },
    onError: () => toast.error(t('admin.errorUpdating')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success(t('admin.scheduleDeleted'));
    },
    onError: () => toast.error(t('admin.errorDeleting')),
  });

  const resetForm = () => {
    setFormData({ clinic_id: '', date: '', start_time: '', end_time: '', max_patients: 10, is_active: true });
    setEditingSchedule(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      clinic_id: schedule.clinic_id,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_patients: schedule.max_patients,
      is_active: schedule.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getClinicName = (schedule: Schedule) => {
    if (!schedule.clinics) return '-';
    return language === 'ar' && schedule.clinics.name_ar 
      ? schedule.clinics.name_ar 
      : schedule.clinics.name;
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('admin.schedules')}</h2>
            <p className="text-muted-foreground">{t('admin.manageSchedules')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('admin.addSchedule')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? t('admin.editSchedule') : t('admin.addSchedule')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('admin.clinic')}</Label>
                  <Select
                    value={formData.clinic_id}
                    onValueChange={(value) => setFormData({ ...formData, clinic_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.selectClinic')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics?.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.date')}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.startTime')}</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.endTime')}</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.maxPatients')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_patients}
                    onChange={(e) => setFormData({ ...formData, max_patients: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>{t('admin.active')}</Label>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingSchedule ? t('admin.update') : t('admin.create')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('admin.schedulesList')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : schedules?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('admin.noSchedules')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.clinic')}</TableHead>
                    <TableHead>{t('admin.date')}</TableHead>
                    <TableHead>{t('admin.time')}</TableHead>
                    <TableHead>{t('admin.maxPatients')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{getClinicName(schedule)}</TableCell>
                      <TableCell>{format(new Date(schedule.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</TableCell>
                      <TableCell>{schedule.max_patients}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          schedule.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {schedule.is_active ? t('admin.active') : t('admin.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(schedule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(schedule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
