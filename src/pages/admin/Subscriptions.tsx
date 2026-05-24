import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Crown, Edit, Loader2, Trash2, Plus, ExternalLink, Upload,
  FileText, History,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import type { Subscription, SubscriptionStatus } from "@/hooks/useSubscription";

interface Row {
  doctor_id: string;
  slug: string;
  email: string;
  is_active: boolean;
  subscription: (Subscription & { plan_type?: "monthly" | "yearly" | null }) | null;
}

interface Payment {
  id: string;
  doctor_id: string;
  amount: number;
  days_extended: number | null;
  plan_type: string | null;
  payment_method: string | null;
  reference: string | null;
  proof_url: string | null;
  notes: string | null;
  paid_at: string;
}

const statusVariants: Record<SubscriptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
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
  const [creating, setCreating] = useState(false);

  const { data: isSuper, isLoading: superLoading } = useQuery({
    queryKey: ["is-superadmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_superadmin", { _user_id: user.id });
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
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          This area is restricted to the super-admin.
        </CardContent></Card>
      </AdminLayout>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["all-subscriptions"] });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doctor Subscriptions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage trials, record payments with proof, and add doctor accounts.
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add doctor
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead>Last payment</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows?.map((r) => {
                    const s = r.subscription;
                    const end = s?.status === "trialing" ? s?.trial_ends_at
                      : s?.status === "active" ? s?.current_period_end : null;
                    return (
                      <TableRow key={r.doctor_id}>
                        <TableCell>
                          <div className="font-medium">{r.slug}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </TableCell>
                        <TableCell>
                          {s ? (
                            <Badge variant={statusVariants[s.status]} className="gap-1">
                              {s.status === "lifetime_free" && <Crown className="h-3 w-3" />}
                              {s.status}
                            </Badge>
                          ) : <Badge variant="outline">none</Badge>}
                        </TableCell>
                        <TableCell className="text-sm capitalize">{s?.plan_type || "—"}</TableCell>
                        <TableCell className="text-sm">{end ? format(new Date(end), "PP") : "—"}</TableCell>
                        <TableCell className="text-sm">
                          {s?.last_payment_date
                            ? `${format(new Date(s.last_payment_date), "PP")}${s.last_payment_amount ? ` · ${s.last_payment_amount} LE` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/?doctor=${r.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-sm inline-flex items-center gap-1 hover:underline"
                          >
                            /{r.slug} <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                            <Edit className="h-3 w-3 mr-1" />Manage
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

      <EditDialog row={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      <CreateDoctorDialog open={creating} onClose={() => setCreating(false)} onCreated={refresh} />
    </AdminLayout>
  );
}

// ============== Edit / record payment ==============

function EditDialog({
  row, onClose, onSaved,
}: { row: Row | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: payments } = useQuery({
    queryKey: ["payments", row?.doctor_id],
    queryFn: async (): Promise<Payment[]> => {
      if (!row) return [];
      const { data } = await supabase
        .from("subscription_payments")
        .select("*")
        .eq("doctor_id", row.doctor_id)
        .order("paid_at", { ascending: false });
      return (data || []) as Payment[];
    },
    enabled: !!row,
  });

  if (!row) return null;
  const s = row.subscription;

  const recordPayment = async (opts: {
    days: number; amount: number; method?: string; reference?: string;
    proofFile?: File | null; notes?: string;
  }) => {
    setSaving(true);
    try {
      let proof_url: string | null = null;
      if (opts.proofFile) {
        const ext = opts.proofFile.name.split(".").pop();
        const path = `${row.doctor_id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, opts.proofFile);
        if (upErr) throw upErr;
        proof_url = path;
      }

      const base = s?.status === "active" && s.current_period_end
        ? new Date(s.current_period_end) : new Date();
      const newEnd = new Date(base.getTime() + opts.days * 24 * 60 * 60 * 1000);

      const { data: { user: u } } = await supabase.auth.getUser();
      const { error: payErr } = await supabase.from("subscription_payments").insert({
        doctor_id: row.doctor_id,
        amount: opts.amount,
        days_extended: opts.days,
        plan_type: s?.plan_type || null,
        payment_method: opts.method || null,
        reference: opts.reference || null,
        proof_url,
        notes: opts.notes || null,
        recorded_by: u?.id || null,
      }).select();
      if (payErr) throw payErr;

      const { error: subErr } = await supabase.from("subscriptions").update({
        status: "active",
        current_period_end: newEnd.toISOString(),
        last_payment_date: new Date().toISOString(),
        last_payment_amount: opts.amount,
        payment_method: opts.method || null,
      }).eq("doctor_id", row.doctor_id).select();
      if (subErr) throw subErr;

      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["payments", row.doctor_id] });
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
      const { error } = await supabase.from("subscriptions")
        .update({ status }).eq("doctor_id", row.doctor_id).select();
      if (error) throw error;
      toast.success("Status updated");
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const extendTrial = async (days: number) => {
    setSaving(true);
    try {
      const base = s?.trial_ends_at && new Date(s.trial_ends_at) > new Date()
        ? new Date(s.trial_ends_at) : new Date();
      const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      const { error } = await supabase.from("subscriptions")
        .update({ status: "trialing", trial_ends_at: newEnd.toISOString() })
        .eq("doctor_id", row.doctor_id).select();
      if (error) throw error;
      toast.success(`Trial +${days}d`);
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const setPlan = async (plan: "monthly" | "yearly") => {
    setSaving(true);
    try {
      const { error } = await supabase.from("subscriptions")
        .update({ plan_type: plan }).eq("doctor_id", row.doctor_id).select();
      if (error) throw error;
      toast.success(`Plan: ${plan}`);
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const removeSub = async () => {
    if (!confirm("Remove this subscription?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("subscriptions").delete().eq("doctor_id", row.doctor_id);
      if (error) throw error;
      toast.success("Removed");
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage: {row.slug}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Plan</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={s?.plan_type === "monthly" ? "default" : "outline"}
                disabled={saving} onClick={() => setPlan("monthly")}>Monthly (200 LE)</Button>
              <Button size="sm" variant={s?.plan_type === "yearly" ? "default" : "outline"}
                disabled={saving} onClick={() => setPlan("yearly")}>Yearly (2000 LE)</Button>
            </div>
          </div>

          <RecordPaymentForm onSubmit={recordPayment} saving={saving} />

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Trial</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={saving} onClick={() => extendTrial(7)}>+7 trial days</Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => extendTrial(30)}>+30 trial days</Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Status override</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saving} onClick={() => setStatus("lifetime_free")}>
                <Crown className="h-3 w-3 mr-1" />Lifetime free
              </Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => setStatus("expired")}>Expire</Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => setStatus("suspended")}>Suspend</Button>
            </div>
          </div>

          <PaymentHistory payments={payments || []} />

          {s && (
            <div className="pt-2 border-t">
              <Button size="sm" variant="destructive" disabled={saving} onClick={removeSub} className="w-full">
                <Trash2 className="h-3 w-3 mr-1" />Remove subscription
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

function RecordPaymentForm({
  onSubmit, saving,
}: {
  onSubmit: (o: { days: number; amount: number; method?: string; reference?: string; proofFile?: File | null; notes?: string }) => void;
  saving: boolean;
}) {
  const [days, setDays] = useState("30");
  const [amount, setAmount] = useState("200");
  const [method, setMethod] = useState("InstaPay");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickFill = (d: number, a: number) => { setDays(String(d)); setAmount(String(a)); };

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
      <Label className="text-xs uppercase text-muted-foreground">Record payment</Label>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" type="button" onClick={() => quickFill(30, 200)}>1 month</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => quickFill(90, 600)}>3 months</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => quickFill(365, 2000)}>1 year</Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Days</Label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></div>
        <div><Label className="text-xs">Amount (LE)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><Label className="text-xs">Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="InstaPay">InstaPay</SelectItem>
              <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
              <SelectItem value="Bank transfer">Bank transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select></div>
        <div><Label className="text-xs">Reference #</Label>
          <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Tx id" /></div>
      </div>

      <div>
        <Label className="text-xs">Proof (image or PDF)</Label>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file && <p className="text-xs text-muted-foreground mt-1">{file.name}</p>}
      </div>

      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <Button
        size="sm"
        disabled={saving}
        onClick={() => {
          const d = parseInt(days), a = parseFloat(amount);
          if (!d || d <= 0 || !a || a <= 0) { toast.error("Days and amount required"); return; }
          onSubmit({ days: d, amount: a, method, reference, proofFile: file, notes });
          setFile(null); setReference(""); setNotes("");
          if (inputRef.current) inputRef.current.value = "";
        }}
      >
        <Upload className="h-3 w-3 mr-1" />Record & extend
      </Button>
    </div>
  );
}

function PaymentHistory({ payments }: { payments: Payment[] }) {
  const openProof = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60 * 10);
    if (error || !data) { toast.error("Could not load proof"); return; }
    window.open(data.signedUrl, "_blank");
  };

  if (!payments.length) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <History className="h-3 w-3" /> No payments recorded yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
        <History className="h-3 w-3" /> Payment history
      </Label>
      <div className="border border-border rounded-md divide-y divide-border">
        {payments.map((p) => (
          <div key={p.id} className="p-2 text-xs flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="font-medium">
                {p.amount} LE {p.days_extended ? `· +${p.days_extended}d` : ""} {p.payment_method ? `· ${p.payment_method}` : ""}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(p.paid_at), "PPp")}{p.reference ? ` · ref ${p.reference}` : ""}
              </div>
              {p.notes && <div className="text-muted-foreground italic">{p.notes}</div>}
            </div>
            {p.proof_url && (
              <Button size="sm" variant="outline" onClick={() => openProof(p.proof_url!)}>
                <FileText className="h-3 w-3 mr-1" />Proof
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Add doctor directly ==============

function CreateDoctorDialog({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", slug: "",
    plan_type: "monthly" as "monthly" | "yearly",
    initial_status: "trialing" as "trialing" | "active" | "lifetime_free",
  });
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Name and email required"); return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-doctor-account", {
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          slug: form.slug.trim() || undefined,
          plan_type: form.plan_type,
          initial_status: form.initial_status,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Doctor created");
      setTempPwd(data?.temp_password || null);
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    } finally { setBusy(false); }
  };

  const close = () => {
    setTempPwd(null);
    setForm({ full_name: "", email: "", phone: "", slug: "", plan_type: "monthly", initial_status: "trialing" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add doctor account</DialogTitle></DialogHeader>
        {tempPwd ? (
          <div className="space-y-3">
            <p className="text-sm">Account created for <strong>{form.email}</strong>. Share this temporary password:</p>
            <div className="p-3 bg-muted rounded font-mono text-sm break-all">{tempPwd}</div>
            <Button className="w-full" onClick={close}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Slug (optional)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from email" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Plan</Label>
                <Select value={form.plan_type} onValueChange={(v: any) => setForm({ ...form, plan_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label>Start as</Label>
                <Select value={form.initial_status} onValueChange={(v: any) => setForm({ ...form, initial_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trialing">30-day trial</SelectItem>
                    <SelectItem value="active">Active (paid)</SelectItem>
                    <SelectItem value="lifetime_free">Lifetime free</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
