import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        setMsg("Account created. Check your email if confirmation is required, then sign in.");
        setMode("signin");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setMsg("If that email exists, a reset link has been sent.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
    } catch (e: any) {
      setMsg(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#0c0a08", color: "#f5f1ea" }}>
      <div style={{ width: "100%", maxWidth: 380, border: "1px solid #2a241d", padding: "2rem", borderRadius: 4 }}>
        <Link to="/" style={{ fontSize: 12, opacity: 0.6, textDecoration: "none", color: "inherit" }}>← back to site</Link>
        <h1 style={{ fontSize: 24, marginTop: 16, marginBottom: 6 }}>Wayne's Admin</h1>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 24 }}>
          {mode === "signin" && "Sign in to manage photos, leads & invoices."}
          {mode === "signup" && "Create owner account (first signup = admin)."}
          {mode === "forgot" && "Enter your email to receive a password reset link."}
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} />
          {mode !== "forgot" && (
            <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle} />
          )}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>
        {msg && <p style={{ fontSize: 12, marginTop: 12, color: "#e3b58a" }}>{msg}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
          {mode !== "signin" && (
            <button onClick={() => { setMode("signin"); setMsg(null); }} style={linkBtn}>← Back to sign in</button>
          )}
          {mode === "signin" && (
            <>
              <button onClick={() => { setMode("forgot"); setMsg(null); }} style={linkBtn}>Forgot password?</button>
              <button onClick={() => { setMode("signup"); setMsg(null); }} style={linkBtn}>Need an account? Sign up</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", background: "#1a1612", border: "1px solid #2a241d", color: "#f5f1ea", borderRadius: 3, fontSize: 14,
};
const btnStyle: React.CSSProperties = {
  padding: "10px 12px", background: "#e3b58a", border: "none", color: "#0c0a08", fontWeight: 600, borderRadius: 3, cursor: "pointer", fontSize: 14,
};
const linkBtn: React.CSSProperties = {
  background: "none", border: "none", color: "#a89684", fontSize: 12, cursor: "pointer", textAlign: "left", padding: 0,
};
