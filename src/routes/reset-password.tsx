import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // If user lands with an existing session (already exchanged), allow update too
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Password updated. Redirecting…");
      setTimeout(() => navigate({ to: "/admin" }), 800);
    } catch (e: any) {
      setMsg(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#0c0a08", color: "#f5f1ea" }}>
      <div style={{ width: "100%", maxWidth: 380, border: "1px solid #2a241d", padding: "2rem", borderRadius: 4 }}>
        <Link to="/auth" style={{ fontSize: 12, opacity: 0.6, textDecoration: "none", color: "inherit" }}>← sign in</Link>
        <h1 style={{ fontSize: 24, marginTop: 16, marginBottom: 6 }}>Reset password</h1>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
          {ready ? "Enter your new password below." : "Waiting for recovery link… open this page from the email you received."}
        </p>
        {ready && (
          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <input type="password" required minLength={6} placeholder="New password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "10px 12px", background: "#1a1612", border: "1px solid #2a241d", color: "#f5f1ea", borderRadius: 3, fontSize: 14 }} />
            <button type="submit" disabled={loading}
              style={{ padding: "10px 12px", background: "#e3b58a", border: "none", color: "#0c0a08", fontWeight: 600, borderRadius: 3, cursor: "pointer", fontSize: 14 }}>
              {loading ? "..." : "Update password"}
            </button>
          </form>
        )}
        {msg && <p style={{ fontSize: 12, marginTop: 12, color: "#e3b58a" }}>{msg}</p>}
      </div>
    </div>
  );
}
