## Goal

Rebuild `/` so it mirrors the Canva design (`About Wayne's Western Woodworking`, 1366×6797 — a single tall landing page) while keeping the existing quote form and admin-managed photo gallery wired to the backend.

## Content (pulled from the Canva design)

- **Hero**
  - Eyebrow: "About Wayne's Western Woodworking"
  - Headline: "Handcrafted Furniture Built to Last"
  - Body: custom-built furniture and commercial woodworking; restaurant tables, countertops, retail fixtures, residential furniture; Idaho-based; quality, communication, durability.
- **Services**
  - Custom Furniture, Restaurant Tables, Bar Tops, Community Tables, Point of Sale Counters, Commercial Woodworking, Residential Woodworking
- **Why Clients Choose Wayne's**
  - Custom-built to fit your space
  - Solid wood construction
  - Locally built in Idaho
  - Commercial-grade finishes
  - Direct communication from start to finish
  - Pride in craftsmanship and attention to every detail
- **Concepts / Work gallery** — driven by `work_photos` from the database (already implemented)
- **Lets Build Something Unique** (CTA → existing quote form, writes to `leads`)
- **Contact footer**
  - Kaden Stutzman
  - wayneswesternwoodworking@gmail.com
  - (208) 961-1863

## Page structure

```text
[Nav: logo + jump links: Work · Services · Contact]
[Hero — full bleed, big serif headline, intro paragraph, primary CTA "Get a quote"]
[About paragraph block]
[Services — two-column checklist grid]
[Work gallery — grid of work_photos from DB]
[Why clients choose — two-column checklist]
[CTA banner: "Let's build something unique" + quote form]
[Footer — Kaden, email, phone]
```

## Visual direction

Match the Canva piece's feel: warm, woodsy, editorial. Cream/parchment background, deep walnut + charcoal text, rust/clay accent, serif display headings (e.g. Fraunces or Cormorant) paired with a clean grotesk for body. Generous vertical rhythm. No purple/indigo SaaS gradients.

Tokens added in `src/styles.css` only — no hardcoded color utilities in components.

## Files touched

- `src/routes/index.tsx` — replace placeholder hero/sections with the structure above; keep the existing `useQuery` for `work_photos` and the lead-insert mutation.
- `src/styles.css` — add semantic tokens (background, foreground, primary, accent, muted) and load Google Fonts via a `<link>` in `src/routes/__root.tsx`.
- `src/routes/__root.tsx` — add the font `<link>` tags and update `<title>` / meta description / og tags to the new copy.

## Out of scope

- Admin dashboard, auth flow, invoices, Stripe — untouched.
- No new dependencies; no schema changes; no new routes.

## Open questions (will use defaults if you don't say otherwise)

1. Logo — none in the Canva content. Default: wordmark "Wayne's Western Woodworking" in the serif display font.
2. Hero background — default: large warm photo from the work gallery (first visible `work_photo`); falls back to a textured wood-grain CSS gradient if no photo yet.
3. Show full contact (email + phone) in the footer publicly — default: yes, matching the Canva page.
