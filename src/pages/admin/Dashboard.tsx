import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, ClipboardList, MessageSquare, TrendingUp, Users, ArrowRight, Settings, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useDoctor } from '@/contexts/DoctorContext';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { doctorId } = useDoctor();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats', doctorId],
    queryFn: async () => {
      if (!doctorId) return { totalClinics: 0, totalSchedules: 0, totalAppointments: 0, pendingAppointments: 0, totalConsultations: 0, newConsultations: 0 };
      
      const [clinics, schedules, appointments, consultations] = await Promise.all([
        supabase.from('clinics').select('id', { count: 'exact' }).eq('doctor_id', doctorId),
        supabase.from('schedules').select('id', { count: 'exact' }).eq('doctor_id', doctorId),
        supabase.from('appointments').select('id, status', { count: 'exact' }).eq('doctor_id', doctorId),
        supabase.from('consultation_requests').select('id, status', { count: 'exact' }).eq('doctor_id', doctorId),
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
    enabled: !!doctorId,
  });

  const { data: recentAppointments } = useQuery({
    queryKey: ['recent-appointments', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*, clinics(name)')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!doctorId,
  });

  const { data: recentConsultations } = useQuery({
    queryKey: ['recent-consultations', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data } = await supabase
        .from('consultation_requests')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!doctorId,
  });

  const statCards = [
    {
      title: t('admin.totalClinics'),
      value: stats?.totalClinics || 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      link: '/admin/clinics',
    },
    {
      title: t('admin.totalSchedules'),
      value: stats?.totalSchedules || 0,
      icon: Calendar,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
      link: '/admin/schedules',
    },
    {
      title: t('admin.totalAppointments'),
      value: stats?.totalAppointments || 0,
      subtitle: `${stats?.pendingAppointments || 0} ${t('admin.pending')}`,
      icon: ClipboardList,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      link: '/admin/appointments',
    },
    {
      title: t('admin.consultationRequests'),
      value: stats?.totalConsultations || 0,
      subtitle: `${stats?.newConsultations || 0} ${t('admin.new')}`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      link: '/admin/consultations',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'contacted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('admin.overview')}</h2>
            <p className="text-muted-foreground">{t('admin.welcomeMessage')}</p>
          </div>
          <Link to="/admin/settings">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.settings')}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
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
                  <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('admin.viewAll')}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Recent Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                {t('admin.recentAppointments')}
              </CardTitle>
              <Link to="/admin/appointments">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t('admin.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAppointments && recentAppointments.length > 0 ? (
                <div className="space-y-3">
                  {recentAppointments.map((appointment: any) => (
                    <div 
                      key={appointment.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{appointment.patient_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(appointment.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {t(`admin.${appointment.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">{t('admin.noRecentAppointments')}</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Consultations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t('admin.recentConsultations')}
              </CardTitle>
              <Link to="/admin/consultations">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t('admin.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentConsultations && recentConsultations.length > 0 ? (
                <div className="space-y-3">
                  {recentConsultations.map((consultation: any) => (
                    <div 
                      key={consultation.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{consultation.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(consultation.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {t(`admin.${consultation.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">{t('admin.noRecentConsultations')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('admin.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Link to="/admin/clinics">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('admin.addClinic')}
                </Button>
              </Link>
              <Link to="/admin/schedules">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('admin.addSchedule')}
                </Button>
              </Link>
              <Link to="/admin/appointments">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <ClipboardList className="h-4 w-4" />
                  {t('admin.manageAppointments')}
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  {t('admin.updateProfile')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
