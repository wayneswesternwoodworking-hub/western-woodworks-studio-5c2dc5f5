
## Goal

Rebuild every text-heavy block of the Canva page as real HTML so Wayne/Kaden can edit copy and swap hero/gallery photos from an admin page. The two big reference posters (Restaurant Table Plans, Floating Displays & Finish Options) stay as flat images.

## What becomes editable

| Block | Editable |
|---|---|
| Hero storefront photo | swap photo |
| About headline + subhead + 3 body paragraphs | text |
| About "hats" side photo | swap photo |
| Services list (7 items) | text (add/remove/rename items) |
| Services side photo (IDAHO LIVIN counter) | swap photo |
| Why Clients headline + 6 bullets | text |
| Why Clients bottom-left photo (store interior) | swap photo |
| Why Clients bottom-right photo (IDAHO LIVIN storefront) | swap photo |
| Pine-tree divider | stays as decorative image |
| Restaurant Table Plans poster | stays as image (not editable) |
| Floating Displays + Finish Options poster | stays as image (not editable) |
| CTA: "Lets Build Something Unique" + name + email + phone | text |

## Database

New migration:

```sql
-- public.site_content — single-row key/value store for editable copy
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admins can write" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- public.site_photos — slot → image URL mapping (slot = 'hero' | 'about_side' | 'services_side' | 'why_left' | 'why_right')
CREATE TABLE public.site_photos (
  slot text PRIMARY KEY,
  url text NOT NULL,
  storage_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_photos TO anon, authenticated;
GRANT ALL ON public.site_photos TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.site_photos TO authenticated;
ALTER TABLE public.site_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read" ON public.site_photos FOR SELECT USING (true);
CREATE POLICY "admins can write" ON public.site_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

Seed rows: insert defaults for every `site_content` key and every `site_photos` slot, pointing at CDN URLs of the photos extracted from the Canva (step below). The page renders defaults if a row is missing, so the site never breaks on a fresh DB.

## Asset work (one-time)

1. Extract 5 individual photos from the Canva PNG export: `hero-storefront.jpg`, `about-hats.jpg`, `services-counter.jpg`, `why-interior.jpg`, `why-storefront.jpg`. Upload to Lovable CDN.
2. Re-slice the Canva export to keep only the two infographic posters: `concepts-poster.jpg` (Restaurant Table Plans) and `shelves-poster.jpg` (Floating Displays + Finish Options). Upload to CDN.
3. Delete the three temporary slice assets created last turn (main_top/infographics/cta PNGs).
4. Make sure the `work-photos` bucket is public-read so admin-uploaded replacements are servable. If not already, add a public SELECT policy.

## Page rebuild — `src/routes/index.tsx`

Loader fetches `site_content` and `site_photos` via a public server fn (server publishable client, narrow `TO anon` SELECT). Renders, in order:

1. Sticky nav (unchanged)
2. **Hero**: full-bleed `site_photos.hero` image, max-width 1366
3. **About**: cream band, two-column — left text (headline, subhead, 3 paragraphs from `site_content`), right `site_photos.about_side`
4. **Services**: two-column — left `site_photos.services_side`, right serif heading + checklist from `site_content.services_list` (array)
5. **Why Clients**: cream band, serif heading + 2-col checklist from `site_content.why_list`, then 2-up photo row (`why_left`, `why_right`) with pine-tree divider PNG underneath
6. **Concepts poster** (flat image)
7. **Shelves + Finish poster** (flat image)
8. **Quote form** (unchanged from current build)
9. **CTA band**: cream band, serif headline + name + email + phone from `site_content`, Wayne's logo SVG on the right
10. Footer (unchanged)

Typography matches the Canva: serif headlines (load Playfair Display or DM Serif Display via Google Fonts `<link>` in `__root.tsx`), Archivo body (already loaded).

## Admin editor — `src/routes/_authenticated/admin.content.tsx`

New route. Two cards:

- **Copy** — one input per `site_content` key. Textarea for paragraphs, inputs for headlines, a small list-editor (add/remove/reorder) for `services_list` and `why_list`. Save button per section calls an `upsertSiteContent` server fn (auth + admin-role gated).
- **Photos** — one card per photo slot. Shows current image, "Replace photo" button → uploads file to the `work-photos` bucket via the browser Supabase client, then calls `upsertSitePhoto({ slot, url })`. Old uploaded files are left in the bucket (cleanup is a later concern).

Add an "Edit site content" link in the existing `/admin` dashboard.

## Files touched

- `supabase/migrations/<ts>_site_content.sql` — new
- `src/lib/site-content.functions.ts` — `getSiteContent` (public), `upsertSiteContent` (admin), `upsertSitePhoto` (admin)
- `src/routes/index.tsx` — replace 3-image stack with the structured layout above
- `src/routes/_authenticated/admin.content.tsx` — new editor
- `src/routes/_authenticated/admin.tsx` (or wherever the dashboard lives) — add link
- `src/routes/__root.tsx` — add Google Fonts `<link>` for serif display font
- `src/styles.css` — add styles for the rebuilt sections (about, services, why, cta bands) and serif font token
- `src/assets/*.png.asset.json` — replace 3 slice pointers with 7 new pointers (5 photos + 2 posters)

## Out of scope

- Editing the two infographic posters (text/dimensions/finish swatches live inside the image).
- Reordering sections, adding new sections, multi-language, draft/publish workflow.
- Deleting unused photos from the storage bucket.

## Open questions (defaults if you don't reply)

1. Serif font for headlines — default: **DM Serif Display** (closest free Google Font to the Canva's serif). Alt: Playfair Display.
2. Photo replacement workflow — default: direct upload to `work-photos` bucket from the admin page, publicly servable. Alt: keep upload private and serve through signed URLs (more secure, slower, more code).
3. Should the admin be able to edit Kaden's name/email/phone in the CTA, or hard-code them — default: **editable** (in `site_content`), in case the contact ever changes.
