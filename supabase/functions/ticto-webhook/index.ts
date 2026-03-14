import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Ticto offer codes (from checkout URLs) to internal plans
const OFFER_PLAN_MAP: Record<string, { plan: string; contactsLimit: number }> = {
  "O34DA3017": { plan: "trial", contactsLimit: 5000 },
  "OD0B8D469": { plan: "start", contactsLimit: 1000 },
  "ODA8597D7": { plan: "plus", contactsLimit: 3000 },
  "O19D97FF2": { plan: "pro", contactsLimit: 5000 },
};

// Recharge offer codes (Pix top-ups that reset ai_usage_percent)
const RECHARGE_MAP: Record<string, number> = {
  "O7FB21253": 10,
  "O82700531": 15,
  "OF75DAE2F": 25,
  "O31D85879": 35,
};

// Ticto v2.0 status values
const ACTIVATION_STATUSES = ["authorized"];
const CANCELLATION_STATUSES = [
  "refunded",
  "chargeback",
  "close",
  "subscription_canceled",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("Ticto webhook received:", JSON.stringify(body));

    // Validate token (Ticto sends it in body.token)
    const expectedToken = Deno.env.get("TICTO_WEBHOOK_TOKEN");
    if (expectedToken && body.token !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status: string = body.status || "";
    const email: string = body.customer?.email || "";
    const customerName: string = body.customer?.name || "";
    // offer_code matches the checkout URL code (e.g. "OD0B8D469")
    const offerCode: string =
      body.item?.offer_code ||
      body.url_params?.query_params?.code ||
      "";

    if (!email) {
      console.error("No email found in webhook payload");
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (ACTIVATION_STATUSES.includes(status)) {
      const planInfo = OFFER_PLAN_MAP[offerCode];
      if (!planInfo) {
        console.error(`Unknown offer_code: ${offerCode}`);
        return new Response(
          JSON.stringify({ error: "Unknown offer", offer_code: offerCode }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Try to create user via invite (sends email with password setup link)
      let userCreated = false;
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { name: customerName },
      });

      if (inviteError) {
        if (inviteError.message?.includes("already been registered") || inviteError.message?.includes("already exists")) {
          console.log(`User already exists: ${email}, proceeding with plan update`);
        } else {
          console.error("Error inviting user:", inviteError);
          return new Response(
            JSON.stringify({ error: "Failed to create user account", details: inviteError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        userCreated = true;
        console.log(`User invited successfully: ${email}`);
        // Wait for handle_new_user trigger to create profile
        await delay(2000);
      }

      // Update profile with the purchased plan
      const { data, error } = await supabase
        .from("profiles")
        .update({ plan: planInfo.plan, contacts_limit: planInfo.contactsLimit })
        .eq("email", email)
        .select("id, email, plan")
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return new Response(
          JSON.stringify({ error: "User not found or update failed" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Plan activated: ${data.email} → ${planInfo.plan} (new user: ${userCreated})`);
      return new Response(
        JSON.stringify({ success: true, plan: planInfo.plan, userId: data.id, userCreated }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (CANCELLATION_STATUSES.includes(status)) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ plan: "trial", contacts_limit: 5000 })
        .eq("email", email)
        .select("id, email")
        .single();

      if (error) {
        console.error("Error reverting plan:", error);
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Plan reverted to trial: ${data.email}`);
      return new Response(
        JSON.stringify({ success: true, plan: "trial", userId: data.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Unhandled status: ${status}`);
    return new Response(
      JSON.stringify({ success: true, message: "Status ignored" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
