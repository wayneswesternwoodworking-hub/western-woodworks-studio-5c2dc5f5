import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listAllPhotos, uploadPhoto, updatePhoto, deletePhoto } from "@/lib/photos.functions";
import { listLeads, updateLead, deleteLead } from "@/lib/leads.functions";
import { listClients, upsertClient, deleteClient } from "@/lib/clients.functions";
import { listInvoices, createInvoice, deleteInvoice, createInvoicePaymentLink, type LineItem } from "@/lib/invoices.functions";
import { getSiteContent, upsertSiteContent, upsertSitePhoto } from "@/lib/site-content.functions";
import { getStripeEnvironment, isPaymentsTestMode } from "@/lib/stripe-env";
import "@/styles/admin.css";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Tab = "dashboard" | "leads" | "clients" | "photos" | "invoices" | "content" | "account";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const navigate = useNavigate();
  const [adminCheck, setAdminCheck] = useState<"checking" | "yes" | "no">("checking");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setAdminCheck(data ? "yes" : "no");
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (adminCheck === "checking") return <div className="adm"><div className="adm-empty">Loading…</div></div>;
  if (adminCheck === "no") {
    return (
      <div className="adm">
        <div className="adm-body">
          <div className="adm-card">
            <h2>Not authorized</h2>
            <p>This account isn't an admin. The first user to sign up is granted admin automatically.</p>
            <button className="adm-btn" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      {isPaymentsTestMode() && (
        <div className="adm-banner">Payments are in TEST mode. Real charges will not be processed.</div>
      )}
      <div className="adm-head">
        <h1>Wayne's Western — Admin</h1>
        <button className="adm-btn-ghost" onClick={signOut}>Sign out</button>
      </div>
      <div className="adm-tabs">
        {(["dashboard", "leads", "clients", "photos", "invoices", "content", "account"] as Tab[]).map((t) => (
          <button key={t} className={`adm-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="adm-body">
        {tab === "dashboard" && <Dashboard />}
        {tab === "leads" && <LeadsTab />}
        {tab === "clients" && <ClientsTab />}
        {tab === "photos" && <PhotosTab />}
        {tab === "invoices" && <InvoicesTab />}
        {tab === "content" && <ContentTab />}
        {tab === "account" && <AccountTab />}
      </div>
    </div>
  );
}

function Dashboard() {
  const leadsFn = useServerFn(listLeads);
  const photosFn = useServerFn(listAllPhotos);
  const invoicesFn = useServerFn(listInvoices);
  const clientsFn = useServerFn(listClients);
  const leads = useQuery({ queryKey: ["leads"], queryFn: () => leadsFn() });
  const photos = useQuery({ queryKey: ["photos"], queryFn: () => photosFn() });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => invoicesFn() });
  const clients = useQuery({ queryKey: ["clients"], queryFn: () => clientsFn() });

  const newLeads = leads.data?.filter((l) => l.status === "new").length ?? 0;
  const paid = invoices.data?.filter((i) => i.status === "paid").reduce((s, i) => s + i.subtotal_cents, 0) ?? 0;
  const outstanding = invoices.data?.filter((i) => i.status === "sent").reduce((s, i) => s + i.subtotal_cents, 0) ?? 0;

  return (
    <div>
      <div className="adm-stats">
        <Stat label="New leads" value={newLeads} />
        <Stat label="Total leads" value={leads.data?.length ?? 0} />
        <Stat label="Clients" value={clients.data?.length ?? 0} />
        <Stat label="Photos" value={photos.data?.length ?? 0} />
        <Stat label="Paid (revenue)" value={`$${(paid / 100).toFixed(2)}`} />
        <Stat label="Outstanding" value={`$${(outstanding / 100).toFixed(2)}`} />
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-num">{value}</div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}

function AccountTab() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setMsg("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg("Password updated successfully");
      setPassword("");
      setConfirm("");
    } catch (e: any) {
      setMsg(e.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-card" style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Account</h2>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
        Signed in as: <strong>{user?.email ?? "…"}</strong>
      </div>
      <form onSubmit={changePassword} style={{ display: "grid", gap: 12 }}>
        <label className="adm-label">New password</label>
        <input className="adm-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="adm-label">Confirm new password</label>
        <input className="adm-input" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="adm-row" style={{ marginTop: 4 }}>
          <button className="adm-btn" disabled={loading} type="submit">{loading ? "Updating…" : "Update password"}</button>
        </div>
      </form>
      {msg && <p style={{ marginTop: 12, fontSize: 13, color: msg.includes("success") ? "#8ed5b5" : "#e88a8a" }}>{msg}</p>}
    </div>
  );
}

function LeadsTab() {
  const qc = useQueryClient();
  const fn = useServerFn(listLeads);
  const upd = useServerFn(updateLead);
  const del = useServerFn(deleteLead);
  const { data } = useQuery({ queryKey: ["leads"], queryFn: () => fn() });
  const updateM = useMutation({
    mutationFn: (v: any) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  return (
    <div className="adm-card">
      <h2 style={{ marginTop: 0 }}>Leads</h2>
      {(!data || data.length === 0) && <div className="adm-empty">No leads yet. Quote requests from the site appear here.</div>}
      {data?.map((l) => (
        <div key={l.id} className="adm-list-item">
          <div className="adm-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <strong>{l.name}</strong>{" "}
              <span className={`adm-badge ${l.status}`}>{l.status}</span>
              {l.project_type && <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>· {l.project_type}</span>}
            </div>
            <div className="adm-row">
              <select className="adm-select" style={{ width: "auto" }} value={l.status}
                onChange={(e) => updateM.mutate({ id: l.id, status: e.target.value })}>
                {["new", "contacted", "quoted", "won", "lost"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="adm-btn-ghost adm-btn-danger"
                onClick={() => confirm("Delete this lead?") && delM.mutate(l.id)}>Delete</button>
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {l.email && <a href={`mailto:${l.email}`} style={{ color: "inherit" }}>{l.email}</a>}
            {l.phone && <span> · <a href={`tel:${l.phone}`} style={{ color: "inherit" }}>{l.phone}</a></span>}
            <span> · {new Date(l.created_at).toLocaleString()}</span>
          </div>
          {l.message && <p style={{ marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{l.message}</p>}
          <textarea className="adm-textarea" placeholder="Internal notes" defaultValue={l.notes ?? ""}
            onBlur={(e) => e.target.value !== (l.notes ?? "") && updateM.mutate({ id: l.id, notes: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

function ClientsTab() {
  const qc = useQueryClient();
  const fn = useServerFn(listClients);
  const upsert = useServerFn(upsertClient);
  const del = useServerFn(deleteClient);
  const { data } = useQuery({ queryKey: ["clients"], queryFn: () => fn() });
  const [editing, setEditing] = useState<any | null>(null);
  const upsertM = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditing(null); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  return (
    <div className="adm-card">
      <div className="adm-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Clients</h2>
        <button className="adm-btn" onClick={() => setEditing({ name: "", email: "", phone: "", address: "", notes: "" })}>+ New client</button>
      </div>
      {editing && <ClientForm initial={editing} onCancel={() => setEditing(null)} onSave={(v) => upsertM.mutate(v)} />}
      {(!data || data.length === 0) ? <div className="adm-empty">No clients yet.</div> : (
        <table className="adm-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th></th></tr></thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong>{c.address && <div style={{ fontSize: 11, opacity: 0.6 }}>{c.address}</div>}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="adm-btn-ghost" onClick={() => setEditing(c)}>Edit</button>{" "}
                  <button className="adm-btn-ghost adm-btn-danger" onClick={() => confirm("Delete?") && delM.mutate(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ClientForm({ initial, onSave, onCancel }: { initial: any; onSave: (v: any) => void; onCancel: () => void }) {
  const [f, setF] = useState(initial);
  return (
    <div className="adm-card" style={{ background: "#1a1612" }}>
      <div className="adm-grid2">
        <div><label className="adm-label">Name</label><input className="adm-input" value={f.name ?? ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="adm-label">Email</label><input className="adm-input" type="email" value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="adm-label">Phone</label><input className="adm-input" value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="adm-label">Address</label><input className="adm-input" value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label className="adm-label">Notes</label>
        <textarea className="adm-textarea" value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
      <div className="adm-row" style={{ marginTop: 12 }}>
        <button className="adm-btn" onClick={() => onSave(f)}>Save</button>
        <button className="adm-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function PhotosTab() {
  const qc = useQueryClient();
  const fn = useServerFn(listAllPhotos);
  const up = useServerFn(uploadPhoto);
  const upd = useServerFn(updatePhoto);
  const del = useServerFn(deletePhoto);
  const { data } = useQuery({ queryKey: ["photos"], queryFn: () => fn() });
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upM = useMutation({
    mutationFn: (v: any) => up({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
  const updM = useMutation({
    mutationFn: (v: any) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const buf = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        await upM.mutateAsync({
          filename: file.name,
          contentType: file.type || "image/jpeg",
          base64,
        });
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="adm-card">
      <div className="adm-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Work photos</h2>
        <div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <button className="adm-btn" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? "Uploading…" : "+ Upload photos"}
          </button>
        </div>
      </div>
      {(!data || data.length === 0) ? <div className="adm-empty">No photos yet. Upload a few to populate the homepage gallery.</div> : (
        <div className="adm-photo-grid">
          {data.map((p) => (
            <div key={p.id} className="adm-photo">
              {p.url && <img src={p.url} alt={p.title} />}
              <div className="adm-photo-body">
                <input className="adm-input" defaultValue={p.title} placeholder="Title"
                  onBlur={(e) => e.target.value !== p.title && updM.mutate({ id: p.id, title: e.target.value })} />
                <input className="adm-input" style={{ marginTop: 6 }} defaultValue={p.caption} placeholder="Caption"
                  onBlur={(e) => e.target.value !== p.caption && updM.mutate({ id: p.id, caption: e.target.value })} />
                <div className="adm-row" style={{ marginTop: 8, justifyContent: "space-between" }}>
                  <label style={{ fontSize: 12, opacity: 0.8 }}>
                    <input type="checkbox" defaultChecked={p.visible}
                      onChange={(e) => updM.mutate({ id: p.id, visible: e.target.checked })} /> Visible
                  </label>
                  <div className="adm-row">
                    <input className="adm-input" style={{ width: 60 }} type="number" defaultValue={p.sort_order}
                      onBlur={(e) => Number(e.target.value) !== p.sort_order && updM.mutate({ id: p.id, sort_order: Number(e.target.value) })} />
                    <button className="adm-btn-ghost adm-btn-danger"
                      onClick={() => confirm("Delete this photo?") && delM.mutate(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, opacity: 0.6, marginTop: 12 }}>
        Lower sort numbers show first. Uncheck "Visible" to hide from the public gallery without deleting.
      </p>
    </div>
  );
}

function InvoicesTab() {
  const qc = useQueryClient();
  const fn = useServerFn(listInvoices);
  const clientsFn = useServerFn(listClients);
  const create = useServerFn(createInvoice);
  const del = useServerFn(deleteInvoice);
  const link = useServerFn(createInvoicePaymentLink);
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: () => fn() });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: () => clientsFn() });
  const [creating, setCreating] = useState(false);

  const createM = useMutation({
    mutationFn: (v: any) => create({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); setCreating(false); },
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
  const linkM = useMutation({
    mutationFn: (id: string) => link({ data: { invoice_id: id, environment: getStripeEnvironment() } }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (res?.error) alert("Stripe error: " + res.error);
      else if (res?.url) {
        navigator.clipboard?.writeText(res.url).catch(() => {});
        alert("Payment link created and copied:\n" + res.url);
      }
    },
  });

  return (
    <div className="adm-card">
      <div className="adm-row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Invoices</h2>
        <button className="adm-btn" onClick={() => setCreating(true)} disabled={!clients?.length}>
          {clients?.length ? "+ New invoice" : "Add a client first"}
        </button>
      </div>
      {creating && clients && (
        <InvoiceForm clients={clients} onCancel={() => setCreating(false)} onSave={(v) => createM.mutate(v)} />
      )}
      {(!data || data.length === 0) ? <div className="adm-empty">No invoices yet.</div> : (
        <table className="adm-table">
          <thead><tr><th>#</th><th>Client</th><th>Title</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map((inv: any) => (
              <tr key={inv.id}>
                <td>{inv.invoice_number}</td>
                <td>{inv.clients?.name}</td>
                <td>{inv.title || <em style={{ opacity: 0.5 }}>(untitled)</em>}</td>
                <td>${(inv.subtotal_cents / 100).toFixed(2)}</td>
                <td>
                  <span className={`adm-badge ${inv.status}`}>{inv.status}</span>
                  {inv.paid_at && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>Paid {new Date(inv.paid_at).toLocaleDateString()}</div>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {inv.status === "draft" && (
                    <button className="adm-btn-ghost" onClick={() => linkM.mutate(inv.id)} disabled={linkM.isPending}>
                      {linkM.isPending ? "…" : "Create payment link"}
                    </button>
                  )}
                  {inv.stripe_payment_link_url && (
                    <a className="adm-btn-ghost" href={inv.stripe_payment_link_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block", marginLeft: 4 }}>
                      Open link
                    </a>
                  )}{" "}
                  <button className="adm-btn-ghost adm-btn-danger" onClick={() => confirm("Delete?") && delM.mutate(inv.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function InvoiceForm({ clients, onSave, onCancel }: { clients: any[]; onSave: (v: any) => void; onCancel: () => void }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price_cents: 0 }]);
  const total = items.reduce((s, li) => s + li.quantity * li.unit_price_cents, 0);

  function update(i: number, patch: Partial<LineItem>) {
    setItems(items.map((li, idx) => idx === i ? { ...li, ...patch } : li));
  }

  return (
    <div className="adm-card" style={{ background: "#1a1612" }}>
      <div className="adm-grid2">
        <div>
          <label className="adm-label">Client</label>
          <select className="adm-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="adm-label">Title</label>
          <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Retail counter — Idaho Livin" />
        </div>
      </div>
      <label className="adm-label" style={{ marginTop: 16 }}>Line items</label>
      {items.map((li, i) => (
        <div key={i} className="adm-row" style={{ marginBottom: 8 }}>
          <input className="adm-input" style={{ flex: 2 }} placeholder="Description" value={li.description} onChange={(e) => update(i, { description: e.target.value })} />
          <input className="adm-input" style={{ width: 70 }} type="number" min={1} value={li.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
          <input className="adm-input" style={{ width: 110 }} type="number" min={0} step="0.01" placeholder="Unit $"
            value={li.unit_price_cents / 100}
            onChange={(e) => update(i, { unit_price_cents: Math.round(Number(e.target.value) * 100) })} />
          <button className="adm-btn-ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1}>×</button>
        </div>
      ))}
      <button className="adm-btn-ghost" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price_cents: 0 }])}>+ Add line</button>
      <div style={{ marginTop: 12 }}>
        <label className="adm-label">Notes</label>
        <textarea className="adm-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="adm-row" style={{ marginTop: 12, justifyContent: "space-between" }}>
        <strong>Total: ${(total / 100).toFixed(2)}</strong>
        <div className="adm-row">
          <button className="adm-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="adm-btn" disabled={!clientId || total < 50}
            onClick={() => onSave({ client_id: clientId, title, line_items: items, notes })}>
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Site Content Editor ============

const CONTENT_FIELDS: { key: string; label: string; type: "input" | "textarea" | "list" }[] = [
  { key: "about.headline", label: "About — Headline", type: "input" },
  { key: "about.subhead",  label: "About — Subhead",  type: "input" },
  { key: "about.body",     label: "About — Paragraphs", type: "list" },
  { key: "services.headline", label: "Services — Headline", type: "input" },
  { key: "services.list",     label: "Services — List items", type: "list" },
  { key: "why.headline", label: "Why Clients — Headline", type: "input" },
  { key: "why.list",     label: "Why Clients — List items", type: "list" },
  { key: "cta.headline", label: "CTA — Headline", type: "input" },
  { key: "cta.name",     label: "CTA — Contact name", type: "input" },
  { key: "cta.email",    label: "CTA — Email", type: "input" },
  { key: "cta.phone",    label: "CTA — Phone", type: "input" },
];

const PHOTO_SLOTS: { slot: string; label: string }[] = [
  { slot: "hero",          label: "Hero (storefront)" },
  { slot: "about_side",    label: "About — side photo (hats)" },
  { slot: "services_side", label: "Services — side photo (counter)" },
  { slot: "why_left",      label: "Why Clients — bottom left" },
  { slot: "why_right",     label: "Why Clients — bottom right" },
];

function ContentTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSiteContent);
  const upsertText = useServerFn(upsertSiteContent);
  const upsertPhoto = useServerFn(upsertSitePhoto);
  const { data, isLoading } = useQuery({ queryKey: ["site-content-admin"], queryFn: () => getFn() });

  const saveText = useMutation({
    mutationFn: (v: { key: string; value: any }) => upsertText({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
  });
  const savePhoto = useMutation({
    mutationFn: (v: { slot: string; filename: string; contentType: string; base64: string }) =>
      upsertPhoto({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-content-admin"] });
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
  });

  if (isLoading || !data) return <div className="adm-empty">Loading…</div>;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="adm-card">
        <h2>Homepage copy</h2>
        <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 14 }}>
          Edit any text. Press Save on each row to publish immediately.
        </p>
        {CONTENT_FIELDS.map((f) => (
          <FieldEditor
            key={f.key}
            field={f}
            initial={data.content[f.key]}
            onSave={(value) => saveText.mutate({ key: f.key, value })}
            saving={saveText.isPending && saveText.variables?.key === f.key}
          />
        ))}
      </div>

      <div className="adm-card">
        <h2>Homepage photos</h2>
        <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 14 }}>
          Replace any photo by uploading a new one. The infographic posters (Concepts, Floating Displays) aren't editable.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          {PHOTO_SLOTS.map((p) => (
            <PhotoSlotEditor
              key={p.slot}
              slot={p.slot}
              label={p.label}
              currentUrl={data.photos[p.slot]}
              onUpload={(payload) => savePhoto.mutate({ slot: p.slot, ...payload })}
              uploading={savePhoto.isPending && savePhoto.variables?.slot === p.slot}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldEditor({
  field, initial, onSave, saving,
}: {
  field: { key: string; label: string; type: "input" | "textarea" | "list" };
  initial: any;
  onSave: (value: any) => void;
  saving: boolean;
}) {
  const [val, setVal] = useState<any>(
    field.type === "list" ? (Array.isArray(initial) ? initial : []) : (typeof initial === "string" ? initial : "")
  );

  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "16px 0" }}>
      <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.04, color: "var(--muted)" }}>
        {field.label}
      </label>
      {field.type === "input" && (
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          style={{ width: "100%", marginTop: 8, padding: 10, border: "1px solid var(--line)", borderRadius: 4, fontSize: 15 }}
        />
      )}
      {field.type === "list" && (
        <ListEditor items={val} onChange={setVal} />
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button className="adm-btn" disabled={saving} onClick={() => onSave(val)}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function ListEditor({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  return (
    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 6 }}>
          <textarea
            value={item}
            onChange={(e) => {
              const next = [...items]; next[i] = e.target.value; onChange(next);
            }}
            rows={item.length > 100 ? 3 : 1}
            style={{ flex: 1, padding: 8, border: "1px solid var(--line)", borderRadius: 4, fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
          />
          <button
            type="button"
            className="adm-btn-ghost"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            title="Remove"
          >×</button>
          <button
            type="button"
            className="adm-btn-ghost"
            onClick={() => { if (i === 0) return; const next = [...items]; [next[i-1], next[i]] = [next[i], next[i-1]]; onChange(next); }}
            title="Move up"
          >↑</button>
        </div>
      ))}
      <button
        type="button"
        className="adm-btn-ghost"
        onClick={() => onChange([...items, ""])}
        style={{ justifySelf: "start" }}
      >+ Add item</button>
    </div>
  );
}

function PhotoSlotEditor({
  slot, label, currentUrl, onUpload, uploading,
}: {
  slot: string; label: string; currentUrl?: string;
  onUpload: (p: { filename: string; contentType: string; base64: string }) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    onUpload({ filename: file.name, contentType: file.type || "image/jpeg", base64 });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 6, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.04 }}>{label}</div>
      <div style={{ background: "#EFECE5", aspectRatio: "4/3", overflow: "hidden", borderRadius: 4, marginBottom: 10 }}>
        {currentUrl && <img src={currentUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} disabled={uploading} />
      {uploading && <div style={{ fontSize: 12, marginTop: 6, color: "var(--ember)" }}>Uploading…</div>}
    </div>
  );
}
