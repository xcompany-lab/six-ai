import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create user with confirmed email and password
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || "" },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wait for handle_new_user trigger
    await new Promise((r) => setTimeout(r, 2000));

    // Update profile with trial plan
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "trial",
        contacts_limit: 5000,
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", user.user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, userId: user.user.id, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
