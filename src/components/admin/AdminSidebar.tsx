import { Building2, Calendar, ClipboardList, MessageSquare, LayoutDashboard, ChevronLeft, ChevronRight, Home, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDoctorSlug } from '@/hooks/useDoctorSlug';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AdminSidebar() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { state, toggleSidebar } = useSidebar();
  const { buildPath } = useDoctorSlug();
  const collapsed = state === 'collapsed';
  const isRTL = language === 'ar';

  const menuItems = [
    { title: t('admin.dashboard'), url: '/admin', icon: LayoutDashboard },
    { title: t('admin.clinics'), url: '/admin/clinics', icon: Building2 },
    { title: t('admin.schedules'), url: '/admin/schedules', icon: Calendar },
    { title: t('admin.appointments'), url: '/admin/appointments', icon: ClipboardList },
    { title: t('admin.consultations'), url: '/admin/consultations', icon: MessageSquare },
    { title: t('admin.settings'), url: '/admin/settings', icon: Settings },
  ];

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-border"
      side={isRTL ? 'right' : 'left'}
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DR</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground">{t('admin.panel')}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('admin.management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={`flex items-center gap-3 hover:bg-muted/50 rounded-md transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2 space-y-2">
        <NavLink 
          to={buildPath("/")} 
          className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md transition-colors text-muted-foreground hover:text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Home className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('common.backToHome')}</span>}
        </NavLink>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar}
          className="w-full justify-center"
        >
          {collapsed 
            ? (isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) 
            : (isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
          }
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
