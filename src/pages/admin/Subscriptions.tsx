import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Crown, Edit, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import type {
  Subscription,
  SubscriptionStatus,
} from "@/hooks/useSubscription";
import { Trash2 } from "lucide-react";

interface Row {
  doctor_id: string;
  slug: string;
  email: string;
  is_active: boolean;
  subscription: (Subscription & { plan_type?: "monthly" | "yearly" | null }) | null;
}

const statusVariants: Record<
  SubscriptionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  trialing: "secondary",
  active: "default",
  expired: "destructive",
  lifetime_free: "default",
  suspended: "destructive",
};

export default function SubscriptionsAdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);

  // Super-admin check via RPC (is_superadmin)
  const { data: isSuper, isLoading: superLoading } = useQuery({
    queryKey: ["is-superadmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_superadmin", {
        _user_id: user.id,
      });
      return !!data;
    },
    enabled: !!user,
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["all-subscriptions"],
    queryFn: async (): Promise<Row[]> => {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, slug, email, is_active")
        .order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("subscriptions").select("*");
      const subMap = new Map<string, Subscription>(
        (subs || []).map((s: any) => [s.doctor_id, s as Subscription]),
      );
      return (doctors || []).map((d: any) => ({
        doctor_id: d.id,
        slug: d.slug,
        email: d.email,
        is_active: d.is_active,
        subscription: subMap.get(d.id) || null,
      }));
    },
    enabled: !!isSuper,
  });

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
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            This area is restricted to the super-admin.
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Doctor Subscriptions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage every doctor's trial, payments, and lifetime access.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead>Last payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows?.map((r) => {
                    const s = r.subscription;
                    const end =
                      s?.status === "trialing"
                        ? s?.trial_ends_at
                        : s?.status === "active"
                          ? s?.current_period_end
                          : null;
                    return (
                      <TableRow key={r.doctor_id}>
                        <TableCell>
                          <div className="font-medium">{r.slug}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s ? (
                            <Badge
                              variant={statusVariants[s.status]}
                              className="gap-1"
                            >
                              {s.status === "lifetime_free" && (
                                <Crown className="h-3 w-3" />
                              )}
                              {s.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">none</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {s?.plan_type || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {end ? format(new Date(end), "PP") : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s?.last_payment_date
                            ? `${format(new Date(s.last_payment_date), "PP")}${s.last_payment_amount ? ` · ${s.last_payment_amount} LE` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing(r)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <EditDialog
        row={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["all-subscriptions"] });
          setEditing(null);
        }}
      />
    </AdminLayout>
  );
}

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: Row | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  if (!row) return null;
  const s = row.subscription;

  const extend = async (days: number, amount?: number) => {
    setSaving(true);
    try {
      const base =
        s?.status === "active" && s.current_period_end
          ? new Date(s.current_period_end)
          : new Date();
      const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      const payload: any = {
        status: "active",
        current_period_end: newEnd.toISOString(),
      };
      if (amount) {
        payload.last_payment_date = new Date().toISOString();
        payload.last_payment_amount = amount;
      }
      const { error } = await supabase
        .from("subscriptions")
        .update(payload)
        .eq("doctor_id", row.doctor_id)
        .select();
      if (error) throw error;
      toast.success("Subscription extended");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: SubscriptionStatus) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status })
        .eq("doctor_id", row.doctor_id)
        .select();
      if (error) throw error;
      toast.success("Status updated");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const extendTrial = async (days: number) => {
    setSaving(true);
    try {
      const base =
        s?.trial_ends_at && new Date(s.trial_ends_at) > new Date()
          ? new Date(s.trial_ends_at)
          : new Date();
      const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "trialing", trial_ends_at: newEnd.toISOString() })
        .eq("doctor_id", row.doctor_id)
        .select();
      if (error) throw error;
      toast.success(`Trial extended by ${days} days`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const setPlan = async (plan: "monthly" | "yearly") => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan_type: plan })
        .eq("doctor_id", row.doctor_id)
        .select();
      if (error) throw error;
      toast.success(`Plan set to ${plan}`);
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeSub = async () => {
    if (!confirm("Remove this subscription? Doctor's dashboard will lock until a new one is added.")) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("doctor_id", row.doctor_id);
      if (error) throw error;
      toast.success("Subscription removed");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage: {row.slug}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Plan</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={s?.plan_type === "monthly" ? "default" : "outline"}
                disabled={saving} onClick={() => setPlan("monthly")}>
                Monthly (200 LE)
              </Button>
              <Button size="sm" variant={s?.plan_type === "yearly" ? "default" : "outline"}
                disabled={saving} onClick={() => setPlan("yearly")}>
                Yearly (2000 LE)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Mark as paid (extends subscription)
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saving} onClick={() => extend(30, 200)}>
                +1 month (200 LE)
              </Button>
              <Button size="sm" disabled={saving} onClick={() => extend(90, 600)}>
                +3 months (600 LE)
              </Button>
              <Button size="sm" disabled={saving} onClick={() => extend(365, 2000)}>
                +1 year (2000 LE)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Trial</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={saving} onClick={() => extendTrial(7)}>
                +7 trial days
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => extendTrial(30)}>
                +30 trial days
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Status override</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" disabled={saving} onClick={() => setStatus("lifetime_free")}>
                <Crown className="h-3 w-3 mr-1" />
                Lifetime free
              </Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => setStatus("expired")}>
                Expire now
              </Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => setStatus("suspended")}>
                Suspend
              </Button>
            </div>
          </div>

          <CustomExtend onApply={(days, amount) => extend(days, amount)} />

          {s && (
            <div className="pt-2 border-t">
              <Button size="sm" variant="destructive" disabled={saving} onClick={removeSub} className="w-full">
                <Trash2 className="h-3 w-3 mr-1" />
                Remove subscription
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomExtend({
  onApply,
}: {
  onApply: (days: number, amount?: number) => void;
}) {
  const [days, setDays] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-2 pt-2 border-t">
      <Label className="text-xs uppercase text-muted-foreground">
        Custom extension
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Amount (LE)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          onClick={() => {
            const d = parseInt(days);
            if (!d || d <= 0) return;
            onApply(d, amount ? parseFloat(amount) : undefined);
            setDays("");
            setAmount("");
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
