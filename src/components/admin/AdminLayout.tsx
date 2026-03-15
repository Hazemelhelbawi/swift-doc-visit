import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctorSlug } from '@/hooks/useDoctorSlug';
import { Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const { language } = useLanguage();
  const { buildPath } = useDoctorSlug();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate(buildPath('/auth'));
    }
  }, [user, isAdmin, isLoading, navigate, buildPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
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
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
