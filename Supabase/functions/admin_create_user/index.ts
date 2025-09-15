import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateUserBody = {
  email: string;
  password?: string;
  name?: string;
  role?: string;
  company_id?: string | number | null;
  invite?: boolean;
  auto_confirm?: boolean;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CreateUserBody = await req.json().catch(() => ({} as CreateUserBody));
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || crypto.randomUUID();
    const name = (body.name || "").trim();
    const role = (body.role || "employee").trim();
    const companyId = body.company_id ?? null;
    const invite = Boolean(body.invite ?? true);
    const autoConfirm = Boolean(body.auto_confirm ?? false);

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing server env (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to create user (send email confirmation), else locate existing by email
    let authUserId: string | null = null;
    const createRes = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirm,
      user_metadata: { role },
    });
    if (createRes.error) {
      // If user exists, find by email via admin.listUsers
      const listRes = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listRes.error) {
        return new Response(JSON.stringify({ error: createRes.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const found = listRes.data.users.find((u: any) => (u.email || "").toLowerCase() === email);
      if (!found) {
        return new Response(JSON.stringify({ error: createRes.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      authUserId = found.id as string;
      // Reset password and optionally confirm email for existing user
      try {
        await admin.auth.admin.updateUserById(authUserId, { password, email_confirm: autoConfirm });
      } catch (e) {
        console.warn('updateUserById failed:', e);
      }
    } else {
      authUserId = createRes.data.user?.id || null;
    }

    if (!authUserId) {
      return new Response(JSON.stringify({ error: "Failed to create or locate auth user id" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert into public.users by email (avoid UNIQUE email violation)
    const existing = await admin
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existing.error && existing.error.code !== "PGRST116") {
      return new Response(JSON.stringify({ error: existing.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existing.data) {
      const upd = await admin
        .from("users")
        .update({ name, role, is_active: true, user_id: authUserId, company_id: companyId })
        .eq("email", email);
      if (upd.error) {
        return new Response(JSON.stringify({ error: upd.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const ins = await admin.from("users").insert([
        { user_id: authUserId, email, name, role, is_active: true, company_id: companyId },
      ]);
      if (ins.error) {
        return new Response(JSON.stringify({ error: ins.error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Send invite/verification email if requested
    if (invite && !autoConfirm) {
      try {
        const res = await admin.auth.admin.inviteUserByEmail(email);
        // Ignore error if already confirmed or already invited
        if (res.error) {
          console.warn('inviteUserByEmail error:', res.error.message);
        }
      } catch (e) {
        console.warn('inviteUserByEmail exception:', e);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: authUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


