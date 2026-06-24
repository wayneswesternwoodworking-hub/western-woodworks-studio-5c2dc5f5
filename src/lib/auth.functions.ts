import { createServerFn } from "@tanstack/react-start";

export const grantAdminWithInvite = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; inviteCode: string }) => {
    if (!d.userId) throw new Error("User required");
    if (!d.inviteCode) throw new Error("Invite code required");
    return d;
  })
  .handler(async ({ data }) => {
    const expectedInviteCode = process.env.ADMIN_INVITE_CODE;
    if (!expectedInviteCode) throw new Error("Admin invite code is not configured.");
    if (data.inviteCode !== expectedInviteCode) throw new Error("Invalid invite code.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });