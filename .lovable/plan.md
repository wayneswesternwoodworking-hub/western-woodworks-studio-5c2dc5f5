
## Goal

Make the homepage look identical to the Canva design (https://www.canva.com/design/DAHMq95uSSM) — same photos, same sections, same order — and slot the lead-capture form and existing backend underneath without disturbing them.

## Approach

The Canva is a single tall 1366 × 6797 page made up of photos, two custom infographics (Restaurant Table Plans, Floating Displays & Shelves, Finish Options), and a final CTA. Recreating each infographic chart with HTML/CSS would drift from "exact same pictures and everything." Instead:

1. **Export the Canva page as a high-res PNG** (already done in plan-mode exploration) and host it on the Lovable CDN as a single asset.
2. **Slice it into 4 logical sections** so we can interleave native HTML between them:
   - `hero.png` — storefront + About + Services + Why Clients block (the photo-heavy top half)
   - `concepts.png` — pine-tree divider + "Concepts" header + Restaurant Table Plans infographic
   - `shelves.png` — Floating Displays & Shelves + Finish Options infographic
   - `cta.png` — "Lets Build Something Unique" footer block with Kaden's email/phone/logo
3. **Render each slice as a full-width `<img>`** centered with `max-width: 1366px`, stacked in order. This preserves every photo, headline, checklist, dimension drawing, and finish swatch exactly as designed.
4. **Insert the lead form between `cta.png` and the page bottom** — styled with the same cream/walnut palette so it looks native, with a heading like "Request a Quote" and fields (name, email, phone, project type, message) that write to the existing `leads` table.
5. **Keep a small footer strip** below the form with copyright + a discreet "Admin" link (only shown when signed in) → `/admin`.

## Files

- `src/routes/index.tsx` — replace current handcrafted markup with: `<Header />` (minimal, transparent over the hero), 4 stacked `<img>` slices, `<QuoteForm />`, `<SiteFooter />`. Removes the duplicated services/why-clients/concepts blocks since they now live inside the Canva images.
- `src/components/QuoteForm.tsx` — new component, extracted from current inline form. Same Zod validation + `leads` insert mutation already in place.
- `src/assets/canva-hero.png.asset.json` etc. — 4 CDN pointer files created via `lovable-assets create`.
- `src/styles.css` — drop the `.services-grid` / `.why-grid` rules that are no longer used; keep tokens.
- `src/routes/__root.tsx` — no change needed (title/meta already updated last turn).

## What stays in the project (recommendations)

Keep all of these — they're already wired and the Canva doesn't replace them:

- **Lead capture form + `leads` table** — the entire point of the site converting visitors.
- **Auth + `/admin` dashboard** — so Wayne/Kaden can read leads, mark them contacted, etc.
- **`user_roles` + `has_role` RBAC** — protects admin pages.
- **Invoices + Stripe sandbox flow** — useful for sending quote-to-invoice once a lead converts; leave intact even if unused day-one.
- **`work-photos` bucket + table** — repurpose as an admin-managed "Recent Projects" gallery that appears *above* the quote form once Wayne uploads real job photos. If never used, it's harmless and zero-maintenance.
- **SEO metadata** in `__root.tsx`.

Nothing to remove.

## Open questions (defaults if you don't reply)

1. Header over the hero image — default: minimal transparent header with the Wayne's wordmark on the left and a single "Request a Quote" button on the right that scrolls to the form. Alternative: no header at all (Canva has no nav).
2. Recent Projects gallery from `work-photos` — default: render it above the quote form *only if* there are rows in the table, otherwise hide it entirely so the page stays Canva-faithful on day one.
3. Quote form fields — default: name, email, phone (optional), project type (dropdown: Custom Furniture / Restaurant Tables / Bar Tops / Community Tables / POS Counters / Commercial / Residential / Other), message. Matches the Services list in the Canva.
