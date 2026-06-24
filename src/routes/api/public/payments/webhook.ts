import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";

let _supabase: SupabaseClient<Database> | null = null;
function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function markInvoicePaid(invoiceId: string, paymentIntentId: string | null) {
  await getSupabase()
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", invoiceId);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as {
        metadata?: { invoice_id?: string };
        payment_intent?: string;
        payment_link?: string;
      };
      // payment_links don't always pass session metadata; look up invoice via payment_link
      let invoiceId = s.metadata?.invoice_id;
      if (!invoiceId && s.payment_link) {
        const { data } = await getSupabase()
          .from("invoices")
          .select("id")
          .eq("stripe_payment_link_id", s.payment_link)
          .maybeSingle();
        invoiceId = (data as any)?.id;
      }
      if (invoiceId) await markInvoicePaid(invoiceId, s.payment_intent ?? null);
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
