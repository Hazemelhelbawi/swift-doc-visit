import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, UserPlus, Check, X } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TrialRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialty: string | null;
  message: string | null;
  status: "pending" | "contacted" | "converted" | "rejected";
  converted_doctor_id: string | null;
  created_at: string;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  contacted: "outline",
  converted: "default",
  rejected: "destructive",
};

export default function TrialRequestsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [converting, setConverting] = useState<TrialRequest | null>(null);

  const { data: isSuper, isLoading: superLoading } = useQuery({
    queryKey: ["is-superadmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_superadmin", { _user_id: user.id });
      return !!data;
    },
    enabled: !!user,
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["trial-requests"],
    queryFn: async (): Promise<TrialRequest[]> => {
      const { data, error } = await supabase
        .from("trial_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TrialRequest[];
    },
    enabled: !!isSuper,
  });

  const setStatus = async (id: string, status: TrialRequest["status"]) => {
    const { error } = await supabase
      .from("trial_requests")
      .update({ status })
      .eq("id", id)
      .select();
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["trial-requests"] });
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Trial Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            New signups from the public marketing site.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !requests?.length ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                No requests yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.full_name}</div>
                        {r.message && (
                          <div className="text-xs text-muted-foreground max-w-xs truncate">{r.message}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{r.email}</div>
                        <div className="text-xs text-muted-foreground">{r.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">{r.specialty || "—"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(r.created_at), "PP")}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[r.status]}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {r.status !== "converted" && (
                          <Button size="sm" onClick={() => setConverting(r)}>
                            <UserPlus className="h-3 w-3 mr-1" />
                            Convert
                          </Button>
                        )}
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "contacted")}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "rejected")}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConvertDialog
        request={converting}
        onClose={() => setConverting(null)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["trial-requests"] });
          qc.invalidateQueries({ queryKey: ["all-subscriptions"] });
          setConverting(null);
        }}
      />
    </AdminLayout>
  );
}

function ConvertDialog({
  request, onClose, onDone,
}: {
  request: TrialRequest | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [slug, setSlug] = useState("");
  const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  if (!request) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("convert-trial-request", {
        body: {
          trial_request_id: request.id,
          slug: slug.trim() || undefined,
          plan_type: planType,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Doctor account created");
      setTempPwd(data?.temp_password || null);
      if (!data?.temp_password) onDone();
    } catch (e: any) {
      toast.error(e.message || "Conversion failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && (tempPwd ? onDone() : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to doctor account</DialogTitle>
        </DialogHeader>
        {tempPwd ? (
          <div className="space-y-3">
            <p className="text-sm">
              Account created for <strong>{request.email}</strong>. Share this temporary password
              (they should reset it on first login):
            </p>
            <div className="p-3 bg-muted rounded font-mono text-sm break-all">{tempPwd}</div>
            <Button className="w-full" onClick={onDone}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Name:</span> {request.full_name}</div>
              <div><span className="text-muted-foreground">Email:</span> {request.email}</div>
              <div><span className="text-muted-foreground">Phone:</span> {request.phone}</div>
            </div>
            <div className="space-y-1.5">
              <Label>Custom slug (optional)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Initial plan</Label>
              <Select value={planType} onValueChange={(v: "monthly" | "yearly") => setPlanType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (200 LE)</SelectItem>
                  <SelectItem value="yearly">Yearly (2000 LE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              30-day free trial starts immediately. Plan is recorded for billing reference; you'll mark payments manually.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create account
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
