import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type SiteData = {
  content: Record<string, unknown>;
  photos: Record<string, string>;
};

// PUBLIC: read editable content + photo URLs (signs private bucket URLs server-side)
export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<SiteData> => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [{ data: rows }, { data: photoRows }] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_photos").select("slot, url, storage_path"),
  ]);

  const content: Record<string, unknown> = {};
  for (const r of rows ?? []) content[r.key] = r.value;

  const photos: Record<string, string> = {};
  // Sign private bucket paths using admin client only when needed
  let admin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"]> extends infer T ? T : never;
  const needsSigning = (photoRows ?? []).some((p) => p.storage_path);
  if (needsSigning) {
    const mod = await import("@/integrations/supabase/client.server");
    admin = mod.supabaseAdmin as any;
  }
  for (const p of photoRows ?? []) {
    if (p.storage_path && admin) {
      const { data: signed } = await admin.storage.from("work-photos").createSignedUrl(p.storage_path, 60 * 60 * 24 * 7);
      photos[p.slot] = signed?.signedUrl ?? p.url;
    } else {
      photos[p.slot] = p.url;
    }
  }
  return { content, photos };
});

export const upsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: unknown }) => d)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ key: data.key, value: data.value as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertSitePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slot: string; filename: string; contentType: string; base64: string }) => d)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const bytes = Buffer.from(data.base64, "base64");
    const ext = data.filename.split(".").pop() || "jpg";
    const path = `site/${data.slot}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("work-photos")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: signed } = await supabaseAdmin.storage
      .from("work-photos")
      .createSignedUrl(path, 60);

    const { error } = await supabaseAdmin
      .from("site_photos")
      .upsert({ slot: data.slot, url: signed?.signedUrl ?? "", storage_path: path }, { onConflict: "slot" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
