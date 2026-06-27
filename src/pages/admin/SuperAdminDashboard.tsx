import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Users,
  ClipboardList,
  Crown,
  UserPlus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuperAdminDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => {
      const [doctors, appts, consults, trials, subs] = await Promise.all([
        supabase.from("doctors").select("id, is_active", { count: "exact" }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("consultation_requests").select("id", { count: "exact", head: true }),
        supabase.from("trial_requests").select("id, status"),
        supabase.from("subscriptions").select("status"),
      ]);
      const totalDoctors = doctors.count ?? 0;
      const activeDoctors = (doctors.data ?? []).filter((d: any) => d.is_active).length;
      const pendingTrials = (trials.data ?? []).filter((t: any) => t.status === "pending").length;
      const activeSubs = (subs.data ?? []).filter(
        (s: any) => s.status === "active" || s.status === "trialing" || s.status === "lifetime_free"
      ).length;
      return {
        totalDoctors,
        activeDoctors,
        totalAppointments: appts.count ?? 0,
        totalConsultations: consults.count ?? 0,
        pendingTrials,
        activeSubs,
      };
    },
  });

  const { data: recentDoctors } = useQuery({
    queryKey: ["superadmin-recent-doctors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, slug, email, is_active, created_at")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: recentTrials } = useQuery({
    queryKey: ["superadmin-recent-trials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trial_requests")
        .select("id, full_name, email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const cards = [
    {
      title: isAr ? "إجمالي الأطباء" : "Total Doctors",
      value: stats?.totalDoctors ?? 0,
      subtitle: `${stats?.activeDoctors ?? 0} ${isAr ? "نشط" : "active"}`,
      icon: Stethoscope,
      bg: "bg-blue-100 dark:bg-blue-900/30",
      color: "text-blue-600",
      link: "/admin/doctors",
    },
    {
      title: isAr ? "الاشتراكات النشطة" : "Active Subscriptions",
      value: stats?.activeSubs ?? 0,
      icon: Crown,
      bg: "bg-amber-100 dark:bg-amber-900/30",
      color: "text-amber-600",
      link: "/admin/subscriptions",
    },
    {
      title: isAr ? "طلبات التجربة" : "Trial Requests",
      value: stats?.pendingTrials ?? 0,
      subtitle: isAr ? "في الانتظار" : "pending",
      icon: UserPlus,
      bg: "bg-purple-100 dark:bg-purple-900/30",
      color: "text-purple-600",
      link: "/admin/trial-requests",
    },
    {
      title: isAr ? "إجمالي المرضى" : "Total Patients",
      value: stats?.totalAppointments ?? 0,
      subtitle: `${stats?.totalConsultations ?? 0} ${isAr ? "استشارة" : "consultations"}`,
      icon: Users,
      bg: "bg-green-100 dark:bg-green-900/30",
      color: "text-green-600",
      link: "/admin/patients",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {isAr ? "نظرة عامة على المنصة" : "Platform Overview"}
        </h2>
        <p className="text-muted-foreground">
          {isAr
            ? "إدارة جميع الأطباء والاشتراكات والمرضى من مكان واحد."
            : "Manage all doctors, subscriptions, and patients in one place."}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.title} to={c.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                {c.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{c.subtitle}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAr ? "عرض الكل" : "View all"}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              {isAr ? "أحدث الأطباء" : "Recent Doctors"}
            </CardTitle>
            <Link to="/admin/doctors">
              <Button variant="ghost" size="sm" className="gap-1">
                {isAr ? "عرض الكل" : "View all"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentDoctors ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا يوجد أطباء بعد" : "No doctors yet"}
              </p>
            )}
            {(recentDoctors ?? []).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">/{d.slug}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.email}</p>
                </div>
                <Badge variant={d.is_active ? "default" : "secondary"}>
                  {d.is_active ? (isAr ? "نشط" : "Active") : isAr ? "موقوف" : "Inactive"}
                </Badge>
                <a
                  href={`/${d.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Open public page"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              {isAr ? "أحدث طلبات التجربة" : "Recent Trial Requests"}
            </CardTitle>
            <Link to="/admin/trial-requests">
              <Button variant="ghost" size="sm" className="gap-1">
                {isAr ? "عرض الكل" : "View all"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentTrials ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا توجد طلبات" : "No requests"}
              </p>
            )}
            {(recentTrials ?? []).map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                </div>
                <Badge variant={t.status === "pending" ? "destructive" : "secondary"}>
                  {t.status}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(parseISO(t.created_at), "MMM d")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isAr ? "إجراءات سريعة" : "Quick Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/doctors">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Stethoscope className="h-4 w-4" />
              {isAr ? "إدارة الأطباء" : "Manage Doctors"}
            </Button>
          </Link>
          <Link to="/admin/subscriptions">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Crown className="h-4 w-4" />
              {isAr ? "الاشتراكات" : "Subscriptions"}
            </Button>
          </Link>
          <Link to="/admin/trial-requests">
            <Button variant="outline" className="w-full justify-start gap-2">
              <UserPlus className="h-4 w-4" />
              {isAr ? "طلبات التجربة" : "Trial Requests"}
            </Button>
          </Link>
          <Link to="/admin/patients">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Users className="h-4 w-4" />
              {isAr ? "المرضى" : "Patients"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
