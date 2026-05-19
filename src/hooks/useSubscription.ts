import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDoctor } from "@/contexts/DoctorContext";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "expired"
  | "lifetime_free"
  | "suspended";

export interface Subscription {
  id: string;
  doctor_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  payment_method: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Fetches the subscription for the currently logged-in doctor. */
export function useMySubscription() {
  const { doctorId } = useDoctor();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-subscription", doctorId],
    queryFn: async (): Promise<Subscription | null> => {
      if (!doctorId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) {
        console.error("Failed to load subscription:", error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!doctorId && !!user,
  });
}

/** Returns true if the subscription grants active access right now. */
export function hasActiveAccess(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  const now = Date.now();
  if (sub.status === "lifetime_free") return true;
  if (sub.status === "trialing" && sub.trial_ends_at)
    return new Date(sub.trial_ends_at).getTime() > now;
  if (sub.status === "active" && sub.current_period_end)
    return new Date(sub.current_period_end).getTime() > now;
  return false;
}

/** Days remaining until the subscription/trial ends. */
export function daysRemaining(sub: Subscription | null | undefined): number {
  if (!sub) return 0;
  const end =
    sub.status === "trialing"
      ? sub.trial_ends_at
      : sub.status === "active"
        ? sub.current_period_end
        : null;
  if (!end) return 0;
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
