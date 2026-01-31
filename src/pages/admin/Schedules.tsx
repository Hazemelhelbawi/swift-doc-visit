import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScheduleForm } from '@/components/admin/ScheduleForm';
import { ScheduleCard } from '@/components/admin/ScheduleCard';

interface Schedule {
  id: string;
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  is_recurring?: boolean;
  recurrence_pattern?: string | null;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  clinics?: { name: string; name_ar: string | null };
}

interface Clinic {
  id: string;
  name: string;
  name_ar: string | null;
}

const defaultFormData = {
  clinic_id: '',
  date: '',
  start_time: '',
  end_time: '',
  max_patients: 10,
  is_active: true,
  is_recurring: false,
  recurrence_pattern: null as 'daily' | 'weekly' | 'custom' | null,
  recurrence_days: [] as number[],
  recurrence_end_date: '',
};

export default function AdminSchedules() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filterClinic, setFilterClinic] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState(defaultFormData);

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

  const filteredSchedules = schedules?.filter(schedule => {
    if (filterClinic !== 'all' && schedule.clinic_id !== filterClinic) return false;
    if (filterType === 'recurring' && !schedule.is_recurring) return false;
    if (filterType === 'one-time' && schedule.is_recurring) return false;
    return true;
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
        is_recurring: data.is_recurring,
        recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
        recurrence_days: data.is_recurring && data.recurrence_days.length > 0 ? data.recurrence_days : null,
        recurrence_end_date: data.is_recurring && data.recurrence_end_date ? data.recurrence_end_date : null,
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
          is_recurring: data.is_recurring,
          recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
          recurrence_days: data.is_recurring && data.recurrence_days.length > 0 ? data.recurrence_days : null,
          recurrence_end_date: data.is_recurring && data.recurrence_end_date ? data.recurrence_end_date : null,
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
    setFormData(defaultFormData);
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
      is_recurring: schedule.is_recurring || false,
      recurrence_pattern: (schedule.recurrence_pattern as 'daily' | 'weekly' | 'custom') || null,
      recurrence_days: schedule.recurrence_days || [],
      recurrence_end_date: schedule.recurrence_end_date || '',
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

  // Group schedules by clinic for better visualization
  const groupedSchedules = filteredSchedules?.reduce((acc, schedule) => {
    const clinicId = schedule.clinic_id;
    if (!acc[clinicId]) {
      acc[clinicId] = {
        clinic: schedule.clinics,
        schedules: []
      };
    }
    acc[clinicId].schedules.push(schedule);
    return acc;
  }, {} as Record<string, { clinic: { name: string; name_ar: string | null } | undefined; schedules: Schedule[] }>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? t('admin.editSchedule') : t('admin.addSchedule')}
                </DialogTitle>
              </DialogHeader>
              <ScheduleForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                clinics={clinics}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                isEditing={!!editingSchedule}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('common.filter')}:</span>
          </div>
          <Select value={filterClinic} onValueChange={setFilterClinic}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.allClinics')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allClinics')}</SelectItem>
              {clinics?.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('admin.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allTypes')}</SelectItem>
              <SelectItem value="recurring">{t('admin.recurring')}</SelectItem>
              <SelectItem value="one-time">{t('admin.oneTime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Schedules Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('admin.schedulesList')}
              {filteredSchedules && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredSchedules.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : !filteredSchedules || filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('admin.noSchedules')}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  {t('admin.addSchedule')}
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
