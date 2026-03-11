import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Ticto offer IDs to internal plans
// Update these with your real Ticto offer/product IDs
const OFFER_PLAN_MAP: Record<string, { plan: string; contactsLimit: number }> = {
  "OD0B8D469": { plan: "start", contactsLimit: 1000 },
  "ODA8597D7": { plan: "plus", contactsLimit: 3000 },
  "O19D97FF2": { plan: "pro", contactsLimit: 5000 },
};

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

    // Validate webhook token
    const webhookToken = Deno.env.get("TICTO_WEBHOOK_TOKEN");
    const receivedToken =
      body.token ||
      req.headers.get("x-ticto-token") ||
      req.headers.get("authorization");

    if (
      webhookToken &&
      receivedToken !== webhookToken &&
      receivedToken !== `Bearer ${webhookToken}`
    ) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ticto v2.0 payload structure
    const event = body.event || body.status || "";
    const email =
      body.customer?.email ||
      body.buyer?.email ||
      body.email ||
      "";
    const offerId =
      body.offer?.id ||
      body.product?.id ||
      body.offer_id ||
      body.product_id ||
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

    // Activation events
    const activationEvents = [
      "sale",
      "approved",
      "paid",
      "Venda Realizada",
      "order_approved",
    ];

    // Cancellation/refund events
    const cancellationEvents = [
      "refund",
      "refunded",
      "chargeback",
      "cancelled",
      "subscription_cancelled",
      "Reembolso",
      "Chargeback",
      "Cancelada",
      "Encerrado",
    ];

    const normalizedEvent = event.toLowerCase().trim();
    const isActivation = activationEvents.some(
      (e) => normalizedEvent === e.toLowerCase()
    );
    const isCancellation = cancellationEvents.some(
      (e) => normalizedEvent === e.toLowerCase()
    );

    if (isActivation) {
      // Try to find plan by offer ID
      const planInfo = OFFER_PLAN_MAP[offerId];
      if (!planInfo) {
        console.error(`Unknown offer_id: ${offerId}`);
        return new Response(
          JSON.stringify({ error: "Unknown offer", offer_id: offerId }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          plan: planInfo.plan,
          contacts_limit: planInfo.contactsLimit,
        })
        .eq("email", email)
        .select("id, email, plan")
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return new Response(
          JSON.stringify({ error: "User not found or update failed" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Plan activated: ${data.email} → ${planInfo.plan}`);
      return new Response(
        JSON.stringify({
          success: true,
          plan: planInfo.plan,
          userId: data.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (isCancellation) {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          plan: "trial",
          contacts_limit: 5000,
        })
        .eq("email", email)
        .select("id, email")
        .single();

      if (error) {
        console.error("Error reverting plan:", error);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Plan reverted to trial: ${data.email}`);
      return new Response(
        JSON.stringify({ success: true, plan: "trial", userId: data.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Unhandled event: ${event}`);
    return new Response(
      JSON.stringify({ success: true, message: "Event ignored" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
