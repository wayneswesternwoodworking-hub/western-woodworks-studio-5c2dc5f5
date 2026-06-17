## What gets built

**Public site changes**
- Work gallery becomes database-driven (pulls photos from Cloud storage instead of the 4 hardcoded images)
- Quote request form actually submits — saves to a `leads` table instead of just logging

**Admin area at `/admin`** (login required, Wayne is the only account)
- Dashboard: counts of new leads, open invoices, paid this month
- **Leads**: every quote form submission. Status pipeline (new → contacted → quoted → won/lost), notes, convert-to-client button
- **Clients**: name, email, phone, address, notes. Linked to their leads and invoices
- **Work photos**: upload, drag-to-reorder, edit title/caption, delete, toggle visible/hidden
- **Invoices**: pick a client, add line items (description, qty, price), Stripe generates a hosted payment link, you copy/email it to the client. Status auto-updates to "paid" when Stripe confirms payment via webhook

## Stack additions

- **Lovable Cloud** — database, auth, file storage (for work photos), server functions
- **Stripe (Lovable's built-in)** — no Stripe account needed to start. Test mode immediately; Wayne claims the account when ready for real money
- **Login**: email + password for Wayne. One-time account creation, then he stays signed in

## Database tables

```text
profiles         — Wayne's profile (id → auth.users)
user_roles       — role assignments (admin enum); admin check via has_role()
work_photos      — storage_path, title, caption, sort_order, visible
leads            — name, email, phone, project_type, message, status, notes, client_id?, created_at
clients          — name, email, phone, address, notes
invoices         — client_id, line_items (jsonb), subtotal, status (draft/sent/paid/void),
                   stripe_payment_link_url, stripe_payment_intent_id, paid_at
```

Storage bucket: `work-photos` (public read).

RLS: everything admin-only via `has_role(auth.uid(), 'admin')`. Two exceptions:
- `work_photos` SELECT visible=true is public (so the homepage gallery works)
- `leads` INSERT is public (so the quote form works)

## Stripe wiring

- Server function `createInvoicePaymentLink(invoiceId)` → creates Stripe Product + Price + Payment Link, saves URL on the invoice row
- Public webhook route `/api/public/webhooks/stripe` → on `checkout.session.completed`, marks the invoice paid

## Out of scope (call out so you can decide later)

- Emailing invoices automatically (you'll copy the pay link for now; can add Resend later)
- Multi-user/staff roles
- PDF invoice downloads
- Recurring/subscription billing
- Public client portal

## Order of operations

1. Enable Lovable Cloud
2. Run Stripe eligibility check, then enable Stripe payments
3. Migration: tables, RLS, storage bucket, admin role bootstrap
4. Auth page (`/auth`) + protected `_authenticated` layout
5. Replace homepage work gallery with DB query; wire quote form to insert lead
6. Admin shell with sidebar + dashboard
7. Leads page, Clients page, Photos manager, Invoices + Stripe integration
8. Stripe webhook route

Want me to proceed?