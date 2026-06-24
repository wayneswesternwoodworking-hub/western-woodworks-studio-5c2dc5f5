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

  async function signInWithGoogle() {
    setLoading(true);
    setMsg(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/admin" });
    } catch (e: any) {
      setMsg(e.message ?? "Google sign-in failed");
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
        {mode === "signin" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#2a241d" }} />
              <span style={{ fontSize: 11, opacity: 0.6 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#2a241d" }} />
            </div>
            <button type="button" onClick={signInWithGoogle} disabled={loading} style={googleBtnStyle}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.82C14.698 15.768 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.506 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571-.001-.001-.002-.001-.003-.002l6.19 5.238C37.307 36.998 41 30.326 41 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}
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
const googleBtnStyle: React.CSSProperties = {
  padding: "10px 12px", background: "#1a1612", border: "1px solid #2a241d", color: "#f5f1ea", fontWeight: 600, borderRadius: 3, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
};

