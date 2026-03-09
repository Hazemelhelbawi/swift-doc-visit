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
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctor } from '@/contexts/DoctorContext';

interface Clinic {
  id: string;
  name: string;
  name_ar: string | null;
  address: string;
  address_ar: string | null;
  phone: string | null;
  is_active: boolean;
  doctor_name: string | null;
  doctor_name_ar: string | null;
  doctor_specialty: string | null;
  doctor_specialty_ar: string | null;
}

export default function AdminClinics() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { doctorId } = useDoctor();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    address: '',
    address_ar: '',
    phone: '',
    is_active: true,
    doctor_name: '',
    doctor_name_ar: '',
    doctor_specialty: '',
    doctor_specialty_ar: '',
  });

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['admin-clinics', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Clinic[];
    },
    enabled: !!doctorId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!doctorId) throw new Error('No doctor context');
      const { data: result, error } = await supabase.from('clinics').insert({
        name: data.name,
        name_ar: data.name_ar || null,
        address: data.address,
        address_ar: data.address_ar || null,
        phone: data.phone || null,
        is_active: data.is_active,
        doctor_name: data.doctor_name || null,
        doctor_name_ar: data.doctor_name_ar || null,
        doctor_specialty: data.doctor_specialty || null,
        doctor_specialty_ar: data.doctor_specialty_ar || null,
        doctor_id: doctorId,
      }).select();
      if (error) throw error;
      if (!result || result.length === 0) throw new Error('Insert succeeded but no data returned - possible RLS issue');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics', doctorId] });
      toast.success(t('admin.clinicCreated'));
      resetForm();
    },
    onError: (error) => {
      console.error('Clinic create error:', error);
      toast.error(t('admin.errorCreating') + ': ' + (error as any)?.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: data.name,
          name_ar: data.name_ar || null,
          address: data.address,
          address_ar: data.address_ar || null,
          phone: data.phone || null,
          is_active: data.is_active,
          doctor_name: data.doctor_name || null,
          doctor_name_ar: data.doctor_name_ar || null,
          doctor_specialty: data.doctor_specialty || null,
          doctor_specialty_ar: data.doctor_specialty_ar || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics', doctorId] });
      toast.success(t('admin.clinicUpdated'));
      resetForm();
    },
    onError: () => toast.error(t('admin.errorUpdating')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinics').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics', doctorId] });
      toast.success(t('admin.clinicDeleted'));
    },
    onError: () => toast.error(t('admin.errorDeleting')),
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      name_ar: '', 
      address: '', 
      address_ar: '', 
      phone: '', 
      is_active: true,
      doctor_name: '',
      doctor_name_ar: '',
      doctor_specialty: '',
      doctor_specialty_ar: '',
    });
    setEditingClinic(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      name_ar: clinic.name_ar || '',
      address: clinic.address,
      address_ar: clinic.address_ar || '',
      phone: clinic.phone || '',
      is_active: clinic.is_active,
      doctor_name: clinic.doctor_name || '',
      doctor_name_ar: clinic.doctor_name_ar || '',
      doctor_specialty: clinic.doctor_specialty || '',
      doctor_specialty_ar: clinic.doctor_specialty_ar || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClinic) {
      updateMutation.mutate({ id: editingClinic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getLocalizedName = (clinic: Clinic) => 
    language === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name;

  const getLocalizedAddress = (clinic: Clinic) => 
    language === 'ar' && clinic.address_ar ? clinic.address_ar : clinic.address;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('admin.clinics')}</h2>
            <p className="text-muted-foreground">{t('admin.manageClinics')}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('admin.addClinic')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClinic ? t('admin.editClinic') : t('admin.addClinic')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.nameEn')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.nameAr')}</Label>
                    <Input
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('admin.addressEn')}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.addressAr')}</Label>
                    <Input
                      value={formData.address_ar}
                      onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })}
                      dir="rtl"
                    />
                  </div>
                </div>
                {/* Doctor Info Section */}
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t('admin.doctor')} ({t('admin.optional')})</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('admin.doctorName')} (EN)</Label>
                      <Input
                        value={formData.doctor_name}
                        onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.doctorName')} (AR)</Label>
                      <Input
                        value={formData.doctor_name_ar}
                        onChange={(e) => setFormData({ ...formData, doctor_name_ar: e.target.value })}
                        dir="rtl"
                        placeholder="د. جون سميث"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.specialty')} (EN)</Label>
                      <Input
                        value={formData.doctor_specialty}
                        onChange={(e) => setFormData({ ...formData, doctor_specialty: e.target.value })}
                        placeholder="Internal Medicine"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.specialty')} (AR)</Label>
                      <Input
                        value={formData.doctor_specialty_ar}
                        onChange={(e) => setFormData({ ...formData, doctor_specialty_ar: e.target.value })}
                        dir="rtl"
                        placeholder="الطب الباطني"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.phone')}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    type="tel"
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
                  {editingClinic ? t('admin.update') : t('admin.create')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('admin.clinicsList')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
            ) : clinics?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t('admin.noClinics')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.name')}</TableHead>
                    <TableHead>{t('admin.address')}</TableHead>
                    <TableHead>{t('admin.phone')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics?.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{getLocalizedName(clinic)}</TableCell>
                      <TableCell>{getLocalizedAddress(clinic)}</TableCell>
                      <TableCell>{clinic.phone || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          clinic.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {clinic.is_active ? t('admin.active') : t('admin.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(clinic)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteMutation.mutate(clinic.id)}
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
