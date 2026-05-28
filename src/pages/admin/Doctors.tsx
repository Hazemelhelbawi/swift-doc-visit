import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, ExternalLink, Copy } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DoctorRow {
  id: string;
  slug: string;
  email: string;
  user_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function DoctorsPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<DoctorRow | null>(null);

  const { data: isSuper, isLoading: superLoading } = useQuery({
    queryKey: ["is-superadmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("is_superadmin", { _user_id: user.id });
      return !!data;
    },
    enabled: !!user,
  });

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: async (): Promise<DoctorRow[]> => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, slug, email, user_id, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DoctorRow[];
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
  if (!user || !isAdmin) return <Navigate to="/auth?redirect=/admin/doctors" replace />;
  if (!isSuper) {
    return (
      <AdminLayout>
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          Super-admin only.
        </CardContent></Card>
      </AdminLayout>
    );
  }

  const doDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    const { data, error } = await supabase.functions.invoke("delete-doctor-account", {
      body: { doctor_id: target.id },
    });
    if (error || data?.error) {
      toast.error(error?.message || data?.error || "Delete failed");
    } else {
      toast.success(`Deleted ${target.slug}`);
      qc.invalidateQueries({ queryKey: ["all-doctors"] });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create or remove any doctor account.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add doctor
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !doctors?.length ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                No doctors yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {d.slug}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/${d.slug}`);
                              toast.success("Link copied");
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy public link"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{d.email}</TableCell>
                      <TableCell>
                        <Badge variant={d.is_active ? "default" : "secondary"}>
                          {d.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(d.created_at), "PP")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/${d.slug}`} target="_blank">
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleting(d)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateDoctorDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["all-doctors"] });
          setCreateOpen(false);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleting?.slug}</strong> ({deleting?.email}),
              their login, clinics, schedules, appointments and subscription. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

export function CreateDoctorDialog({
  open, onClose, onDone, defaults,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  defaults?: { full_name?: string; email?: string; phone?: string };
}) {
  const [fullName, setFullName] = useState(defaults?.full_name || "");
  const [email, setEmail] = useState(defaults?.email || "");
  const [phone, setPhone] = useState(defaults?.phone || "");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  const reset = () => {
    setFullName(defaults?.full_name || "");
    setEmail(defaults?.email || "");
    setPhone(defaults?.phone || "");
    setSlug("");
    setTempPwd(null);
  };

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-doctor-account", {
        body: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          slug: slug.trim() || undefined,
          initial_status: "trialing",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Doctor account created");
      setTempPwd(data?.temp_password || null);
      if (!data?.temp_password) {
        reset();
        onDone();
      }
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };
  const handleDone = () => {
    reset();
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && (tempPwd ? handleDone() : handleClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
        </DialogHeader>
        {tempPwd ? (
          <div className="space-y-3">
            <p className="text-sm">
              Account created for <strong>{email}</strong>. Share this temporary password:
            </p>
            <div className="p-3 bg-muted rounded font-mono text-sm break-all">{tempPwd}</div>
            <Button className="w-full" onClick={handleDone}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Custom slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from email"
              />
              <p className="text-xs text-muted-foreground">
                Used as the public URL: /{slug || "auto"}
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
