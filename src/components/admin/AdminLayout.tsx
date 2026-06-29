import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { SubscriptionGuard } from './SubscriptionGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctorSlug } from '@/hooks/useDoctorSlug';
import { Loader2 } from 'lucide-react';
import Unauthorized from '@/pages/Unauthorized';

interface AdminLayoutProps {
  children: ReactNode;
  /** Restrict this route to superadmin or doctor only. Defaults to either. */
  requireRole?: 'superadmin' | 'doctor';
}

// Routes that are doctor-only (superadmin doesn't have a doctor_id scope)
const DOCTOR_ONLY = ['/admin/clinics', '/admin/schedules', '/admin/appointments', '/admin/consultations', '/admin/billing', '/admin/settings'];
// Routes that are superadmin-only
const SUPERADMIN_ONLY = ['/admin/doctors', '/admin/trial-requests', '/admin/patients', '/admin/subscriptions'];

export function AdminLayout({ children, requireRole }: AdminLayoutProps) {
  const { user, isLoading, isAdmin, isSuperAdmin, isDoctor, isRoleLoading } = useAuth();
  const { language } = useLanguage();
  const { buildPath } = useDoctorSlug();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || isRoleLoading) return;
    if (!user) navigate(buildPath('/auth'), { replace: true });
  }, [user, isLoading, isRoleLoading, navigate, buildPath]);

  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (!isAdmin) return <Unauthorized />;

  // Role-based path enforcement
  const path = location.pathname;
  const violatesExplicit = requireRole === 'superadmin' ? !isSuperAdmin : requireRole === 'doctor' ? !isDoctor : false;
  const violatesDoctorOnly = DOCTOR_ONLY.some((p) => path.startsWith(p)) && !isDoctor && !isSuperAdmin;
  const violatesSuperOnly = SUPERADMIN_ONLY.some((p) => path.startsWith(p)) && !isSuperAdmin;
  if (violatesExplicit || violatesDoctorOnly || violatesSuperOnly) {
    return <Unauthorized />;
  }

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full bg-muted/30`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className={`h-14 border-b border-border bg-background flex items-center px-4 gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <SidebarTrigger />
            <h1 className="font-semibold text-foreground">{language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <SubscriptionGuard>{children}</SubscriptionGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
