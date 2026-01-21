import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, ClipboardList, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [clinics, schedules, appointments, consultations] = await Promise.all([
        supabase.from('clinics').select('id', { count: 'exact' }),
        supabase.from('schedules').select('id', { count: 'exact' }),
        supabase.from('appointments').select('id, status', { count: 'exact' }),
        supabase.from('consultation_requests').select('id, status', { count: 'exact' }),
      ]);

      const pendingAppointments = appointments.data?.filter(a => a.status === 'pending').length || 0;
      const newConsultations = consultations.data?.filter(c => c.status === 'new').length || 0;

      return {
        totalClinics: clinics.count || 0,
        totalSchedules: schedules.count || 0,
        totalAppointments: appointments.count || 0,
        pendingAppointments,
        totalConsultations: consultations.count || 0,
        newConsultations,
      };
    },
  });

  const statCards = [
    {
      title: t('admin.totalClinics'),
      value: stats?.totalClinics || 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: t('admin.totalSchedules'),
      value: stats?.totalSchedules || 0,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: t('admin.totalAppointments'),
      value: stats?.totalAppointments || 0,
      subtitle: `${stats?.pendingAppointments || 0} ${t('admin.pending')}`,
      icon: ClipboardList,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      title: t('admin.consultationRequests'),
      value: stats?.totalConsultations || 0,
      subtitle: `${stats?.newConsultations || 0} ${t('admin.new')}`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('admin.overview')}</h2>
          <p className="text-muted-foreground">{t('admin.welcomeMessage')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('admin.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t('admin.activityPlaceholder')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('admin.quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">{t('admin.actionsPlaceholder')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
