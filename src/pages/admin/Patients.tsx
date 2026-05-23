import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Patient {
  key: string; // phone|name composite
  name: string;
  phone: string;
  email: string | null;
  doctor_ids: Set<string>;
  appointments: number;
  consultations: number;
  last_seen: string;
}

interface AnyRow {
  source: "appointment" | "consultation";
  doctor_id: string;
  patient_name: string;
  patient_phone: string;
  email: string | null;
  created_at: string;
}

export default function PatientsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");

  const { data: isSuper, isLoading: superLoading } = useQuery({
    queryKey: ["is-superadmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_superadmin", { _user_id: user.id });
      return !!data;
    },
    enabled: !!user,
  });

  const { data: doctors } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("id, slug, email").order("slug");
      return data || [];
    },
    enabled: !!isSuper,
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["all-patient-rows"],
    queryFn: async (): Promise<AnyRow[]> => {
      const [apps, cons] = await Promise.all([
        supabase.from("appointments").select("doctor_id, patient_name, patient_phone, created_at"),
        supabase.from("consultation_requests").select("doctor_id, full_name, phone, created_at"),
      ]);
      const out: AnyRow[] = [];
      (apps.data || []).forEach((a: any) =>
        out.push({
          source: "appointment",
          doctor_id: a.doctor_id,
          patient_name: a.patient_name,
          patient_phone: a.patient_phone,
          email: null,
          created_at: a.created_at,
        })
      );
      (cons.data || []).forEach((c: any) =>
        out.push({
          source: "consultation",
          doctor_id: c.doctor_id,
          patient_name: c.full_name,
          patient_phone: c.phone,
          email: null,
          created_at: c.created_at,
        })
      );
      return out;
    },
    enabled: !!isSuper,
  });

  const doctorMap = useMemo(() => {
    const m = new Map<string, string>();
    (doctors || []).forEach((d: any) => m.set(d.id, d.slug));
    return m;
  }, [doctors]);

  const unified: Patient[] = useMemo(() => {
    const map = new Map<string, Patient>();
    (rows || []).forEach((r) => {
      const key = (r.patient_phone || "") + "|" + (r.patient_name || "").toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: r.patient_name,
          phone: r.patient_phone,
          email: r.email,
          doctor_ids: new Set(),
          appointments: 0,
          consultations: 0,
          last_seen: r.created_at,
        });
      }
      const p = map.get(key)!;
      p.doctor_ids.add(r.doctor_id);
      if (r.source === "appointment") p.appointments++;
      else p.consultations++;
      if (new Date(r.created_at) > new Date(p.last_seen)) p.last_seen = r.created_at;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );
  }, [rows]);

  const filteredUnified = unified.filter((p) => {
    const s = search.toLowerCase();
    return !s || p.name.toLowerCase().includes(s) || p.phone.includes(s);
  });

  const byDoctor = useMemo(() => {
    if (doctorFilter === "all") return unified;
    return unified.filter((p) => p.doctor_ids.has(doctorFilter));
  }, [unified, doctorFilter]);

  if (authLoading || superLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/auth" replace />;
  if (!isSuper) {
    return (
      <AdminLayout>
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Super-admin only.
        </CardContent></Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Everyone who's booked an appointment or sent a consultation across all doctors.
          </p>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All patients ({unified.length})</TabsTrigger>
            <TabsTrigger value="by-doctor">By doctor</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative max-w-sm">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <PatientTable patients={filteredUnified} doctorMap={doctorMap} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-doctor">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="max-w-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All doctors</SelectItem>
                    {(doctors || []).map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PatientTable patients={byDoctor} doctorMap={doctorMap} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function PatientTable({
  patients, doctorMap, isLoading,
}: {
  patients: Patient[];
  doctorMap: Map<string, string>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!patients.length) {
    return <div className="p-10 text-center text-muted-foreground text-sm">No patients found.</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Doctors</TableHead>
          <TableHead>Appointments</TableHead>
          <TableHead>Consultations</TableHead>
          <TableHead>Last seen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((p) => (
          <TableRow key={p.key}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell className="text-sm">{p.phone}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {Array.from(p.doctor_ids).map((id) => (
                  <Badge key={id} variant="outline" className="text-xs">
                    {doctorMap.get(id) || id.slice(0, 6)}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-sm">{p.appointments}</TableCell>
            <TableCell className="text-sm">{p.consultations}</TableCell>
            <TableCell className="text-sm">{format(new Date(p.last_seen), "PP")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
