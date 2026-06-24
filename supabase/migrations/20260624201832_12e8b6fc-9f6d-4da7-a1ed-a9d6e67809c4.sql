
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content readable by all" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content writable by admins" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.site_photos (
  slot text PRIMARY KEY,
  url text NOT NULL,
  storage_path text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_photos TO authenticated;
GRANT ALL ON public.site_photos TO service_role;
ALTER TABLE public.site_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_photos readable by all" ON public.site_photos FOR SELECT USING (true);
CREATE POLICY "site_photos writable by admins" ON public.site_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_photos_updated_at BEFORE UPDATE ON public.site_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
