import type { StripeEnv } from "@/lib/stripe.server";

const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function getStripeEnvironment(): StripeEnv {
  if (token?.startsWith("pk_test_")) return "sandbox";
  if (token?.startsWith("pk_live_")) return "live";
  throw new Error("Payments are not configured. Complete go-live to accept real payments.");
}

export function isPaymentsConfigured() {
  return !!token && (token.startsWith("pk_test_") || token.startsWith("pk_live_"));
}

export function isPaymentsTestMode() {
  return !!token && token.startsWith("pk_test_");
}
