import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type SiteData = {
  content: Record<string, any>;
  photos: Record<string, string>;
};

// PUBLIC: read editable content + photo URLs (signs private bucket URLs server-side)
export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [{ data: rows }, { data: photoRows }] = await Promise.all([
    supabase.from("site_content").select("key, value"),
    supabase.from("site_photos").select("slot, url, storage_path"),
  ]);

  const content: Record<string, any> = {};
  for (const r of rows ?? []) content[r.key] = r.value;

  const photos: Record<string, string> = {};
  const needsSigning = (photoRows ?? []).some((p) => p.storage_path);
  let admin: any = null;
  if (needsSigning) {
    const mod = await import("@/integrations/supabase/client.server");
    admin = mod.supabaseAdmin;
  }
  for (const p of photoRows ?? []) {
    if (p.storage_path && admin) {
      const { data: signed } = await admin.storage
        .from("work-photos")
        .createSignedUrl(p.storage_path, 60 * 60 * 24 * 7);
      photos[p.slot] = signed?.signedUrl ?? p.url;
    } else {
      photos[p.slot] = p.url;
    }
  }
  return { content, photos } as SiteData;
});

export const upsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: any }) => d)
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin-guard.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("site_content")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
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

    const { error } = await supabaseAdmin
      .from("site_photos")
      .upsert({ slot: data.slot, url: "", storage_path: path }, { onConflict: "slot" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
