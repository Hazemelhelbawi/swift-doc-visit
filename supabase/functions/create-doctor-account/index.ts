// Super-admin: create a doctor account directly (without a trial_request).
// Optionally assigns initial plan / status (trialing, active, lifetime_free, etc.).
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

    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      slug,
      plan_type,            // 'monthly' | 'yearly' | null
      initial_status,       // 'trialing' | 'active' | 'lifetime_free'
      period_days,          // for 'active': days until current_period_end
    } = body || {};

    if (!email || !full_name) return json({ error: "full_name and email required" }, 400);

    const randomPwd = crypto.randomUUID() + "Aa1!";
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: randomPwd,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });
    if (createErr || !created.user) return json({ error: createErr?.message || "User creation failed" }, 400);
    const newUserId = created.user.id;

    await admin.from("user_roles").upsert(
      { user_id: newUserId, role: "admin" },
      { onConflict: "user_id,role" },
    );
    await admin.from("profiles").update({ phone, full_name }).eq("user_id", newUserId);

    const docPayload: any = { email, user_id: newUserId, is_active: true };
    if (slug) docPayload.slug = slug;
    const { data: doctor, error: docErr } = await admin
      .from("doctors")
      .insert(docPayload)
      .select()
      .single();
    if (docErr || !doctor) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: docErr?.message || "Doctor create failed" }, 400);
    }

    // Build subscription based on initial_status
    const sub: any = { doctor_id: doctor.id, plan_type: plan_type || null };
    const status = initial_status || "trialing";
    sub.status = status;
    if (status === "trialing") {
      sub.trial_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (status === "active") {
      const days = period_days || (plan_type === "yearly" ? 365 : 30);
      sub.current_period_end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    await admin.from("subscriptions").upsert(sub, { onConflict: "doctor_id" });

    return json({ success: true, doctor, temp_password: randomPwd });
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
