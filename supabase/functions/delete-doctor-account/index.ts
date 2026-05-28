// Super-admin: hard-delete a doctor account (auth user + doctor row).
// All FK-less child rows (appointments, clinics, schedules, settings, etc.)
// are removed first to keep the database clean.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isSuper } = await admin.rpc("is_superadmin", { _user_id: userRes.user.id });
    if (!isSuper) return json({ error: "Forbidden — super-admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const { doctor_id } = body || {};
    if (!doctor_id) return json({ error: "doctor_id required" }, 400);

    const { data: doctor, error: docErr } = await admin
      .from("doctors")
      .select("id, user_id")
      .eq("id", doctor_id)
      .maybeSingle();
    if (docErr) return json({ error: docErr.message }, 400);
    if (!doctor) return json({ error: "Doctor not found" }, 404);

    // Wipe tenant data (FKs aren't declared; clean by doctor_id).
    await admin.from("appointments").delete().eq("doctor_id", doctor_id);
    await admin.from("schedules").delete().eq("doctor_id", doctor_id);
    await admin.from("consultation_requests").delete().eq("doctor_id", doctor_id);
    await admin.from("clinics").delete().eq("doctor_id", doctor_id);
    await admin.from("site_settings").delete().eq("doctor_id", doctor_id);
    await admin.from("subscription_payments").delete().eq("doctor_id", doctor_id);
    await admin.from("subscriptions").delete().eq("doctor_id", doctor_id);
    await admin.from("doctors").delete().eq("id", doctor_id);

    if (doctor.user_id) {
      await admin.from("user_roles").delete().eq("user_id", doctor.user_id);
      await admin.from("profiles").delete().eq("user_id", doctor.user_id);
      await admin.auth.admin.deleteUser(doctor.user_id);
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
