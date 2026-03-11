import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Kiwify product IDs to internal plans
// Replace these with your real Kiwify product IDs
const PRODUCT_PLAN_MAP: Record<string, { plan: string; contactsLimit: number }> = {
  "KIWIFY_PRODUCT_START": { plan: "start", contactsLimit: 1000 },
  "KIWIFY_PRODUCT_PLUS": { plan: "plus", contactsLimit: 3000 },
  "KIWIFY_PRODUCT_PRO": { plan: "pro", contactsLimit: 5000 },
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
    // Validate webhook token
    const webhookToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    const authHeader = req.headers.get("x-kiwify-token") || req.headers.get("authorization");
    
    if (webhookToken && authHeader !== webhookToken && authHeader !== `Bearer ${webhookToken}`) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Kiwify webhook received:", JSON.stringify(body));

    const event = body.order_status || body.event;
    const email = body.Customer?.email || body.customer?.email || body.email;
    const productId = body.Product?.id || body.product?.id || body.product_id;

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

    if (event === "paid" || event === "order_approved" || event === "approved") {
      // Find plan by product ID
      const planInfo = PRODUCT_PLAN_MAP[productId];
      if (!planInfo) {
        console.error(`Unknown product_id: ${productId}`);
        return new Response(JSON.stringify({ error: "Unknown product" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update user profile by email
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
        return new Response(JSON.stringify({ error: "User not found or update failed" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Plan activated: ${data.email} → ${planInfo.plan}`);
      return new Response(JSON.stringify({ success: true, plan: planInfo.plan, userId: data.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "refund" || event === "refunded" || event === "subscription_cancelled" || event === "cancelled" || event === "chargeback") {
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
      return new Response(JSON.stringify({ success: true, plan: "trial", userId: data.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Unhandled event: ${event}`);
    return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
