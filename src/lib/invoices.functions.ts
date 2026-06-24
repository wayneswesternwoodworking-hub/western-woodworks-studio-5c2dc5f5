import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createStripeClient,
  getStripeErrorMessage,
  type StripeEnv,
} from "@/lib/stripe.server";

export type LineItem = { description: string; quantity: number; unit_price_cents: number };

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("invoices")
      .select("*, clients(name, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    client_id: string;
    title: string;
    line_items: LineItem[];
    notes?: string;
  }) => {
    if (!d.client_id) throw new Error("Client required");
    if (!d.line_items?.length) throw new Error("At least one line item");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const subtotal = data.line_items.reduce(
      (s, li) => s + Math.round(li.quantity * li.unit_price_cents),
      0,
    );
    const { data: row, error } = await context.supabase
      .from("invoices")
      .insert({
        client_id: data.client_id,
        title: data.title,
        line_items: data.line_items,
        subtotal_cents: subtotal,
        notes: data.notes ?? null,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Create a Stripe Product+Price+PaymentLink for the invoice and save URL.
export const createInvoicePaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { invoice_id: string; environment: StripeEnv }) => d)
  .handler(async ({ data, context }) => {
    try {
      const { assertAdmin } = await import("@/lib/admin-guard.server");
      await assertAdmin(context.supabase, context.userId);

      const { data: inv, error } = await context.supabase
        .from("invoices")
        .select("*, clients(name, email)")
        .eq("id", data.invoice_id)
        .single();
      if (error || !inv) throw new Error("Invoice not found");
      if (inv.subtotal_cents < 50) throw new Error("Amount must be at least $0.50");

      const stripe = createStripeClient(data.environment);
      const product = await stripe.products.create({
        name: inv.title || `Invoice #${inv.invoice_number}`,
        metadata: { invoice_id: inv.id },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: inv.subtotal_cents,
        currency: "usd",
      });
      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { invoice_id: inv.id },
      });

      const { error: upErr } = await context.supabase
        .from("invoices")
        .update({
          status: "sent",
          stripe_payment_link_id: link.id,
          stripe_payment_link_url: link.url,
        })
        .eq("id", inv.id);
      if (upErr) throw new Error(upErr.message);

      return { url: link.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
