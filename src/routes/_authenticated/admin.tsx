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

type Tab = "dashboard" | "leads" | "clients" | "photos" | "invoices" | "content";

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
        {(["dashboard", "leads", "clients", "photos", "invoices", "content"] as Tab[]).map((t) => (
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
