import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitLead } from "@/lib/leads.functions";
import { getSiteContent, type SiteData } from "@/lib/site-content.functions";
import conceptsPoster from "@/assets/concepts-poster.png.asset.json";
import shelvesPoster from "@/assets/shelves-poster.png.asset.json";

const siteOpts = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteOpts),
  errorComponent: ({ error }) => (
    <div className="wrap" style={{ padding: 60 }}><h2>Couldn't load the page</h2><p>{error.message}</p></div>
  ),
  notFoundComponent: () => <div className="wrap" style={{ padding: 60 }}>Not found</div>,
  component: Index,
});

function s(data: SiteData, key: string, fallback: string): string {
  const v = data.content[key];
  return typeof v === "string" ? v : fallback;
}
function sArr(data: SiteData, key: string, fallback: string[]): string[] {
  const v = data.content[key];
  return Array.isArray(v) ? (v as string[]) : fallback;
}

function Index() {
  const { data } = useSuspenseQuery(siteOpts);
  const photos = data.photos;

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="brand">Wayne's Western <span>Woodworking</span></a>
          <div className="nav-links">
            <a href="#quote" className="pill">Request a quote</a>
          </div>
        </div>
      </nav>

      <main id="top" className="ww-page">
        <section className="ww-hero">
          {photos.hero && <img src={photos.hero} alt="Wayne's Western Woodworking storefront" />}
          <div className="ww-hero-copy">
            <p>Boise, Idaho custom woodworking</p>
            <h1>Custom wood counters, tables, and fixtures built in Idaho</h1>
            <a href="#quote">Request a quote</a>
          </div>
        </section>

        {/* About */}
        <section className="ww-band">
          <div className="ww-two">
            <div className="ww-col-text">
              <h2 className="ww-serif">{s(data, "about.headline", "About Wayne's Western Woodworking")}</h2>
              <p className="ww-sub ww-serif">{s(data, "about.subhead", "Handcrafted Furniture Built to Last")}</p>
              {sArr(data, "about.body", []).map((p, i) => (
                <p key={i} className="ww-p">{p}</p>
              ))}
            </div>
            <div className="ww-col-photo">
              {photos.about_side && <img src={photos.about_side} alt="Hat display" loading="lazy" />}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="ww-band">
          <div className="ww-two">
            <div className="ww-col-photo">
              {photos.services_side && <img src={photos.services_side} alt="Custom counter" loading="lazy" />}
            </div>
            <div className="ww-col-text">
              <h2 className="ww-serif">{s(data, "services.headline", "Services")}</h2>
              <ul className="ww-check">
                {sArr(data, "services.list", []).map((item, i) => (
                  <li key={i}><span className="ww-tick">✓</span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Why Clients */}
        <section className="ww-band">
          <h2 className="ww-serif ww-center">{s(data, "why.headline", "Why Clients Choose Wayne's Western Woodworking")}</h2>
          <ul className="ww-check ww-check-2col">
            {sArr(data, "why.list", []).map((item, i) => (
              <li key={i}><span className="ww-tick">✓</span>{item}</li>
            ))}
          </ul>
          <div className="ww-two-photos">
            {photos.why_left && <img src={photos.why_left} alt="Workshop interior" loading="lazy" />}
            {photos.why_right && <img src={photos.why_right} alt="Idaho Livin storefront" loading="lazy" />}
          </div>
        </section>

        {/* Posters (not editable) */}
        <section className="ww-poster">
          <img src={conceptsPoster.url} alt="Restaurant table plans — Concepts" loading="lazy" />
        </section>
        <section className="ww-poster">
          <img src={shelvesPoster.url} alt="Floating displays, shelves, and finish options" loading="lazy" />
        </section>

        {/* Quote form */}
        <QuoteSection />

        {/* CTA */}
        <section className="ww-band ww-cta">
          <h2 className="ww-serif ww-center">{s(data, "cta.headline", "Lets Build Something Unique")}</h2>
          <p className="ww-cta-name">{s(data, "cta.name", "Kaden Stutzman")}</p>
          <p className="ww-cta-contact">
            <a href={`mailto:${s(data, "cta.email", "")}`}>{s(data, "cta.email", "")}</a>
            <span className="ww-dot">·</span>
            <a href={`tel:${s(data, "cta.phone", "").replace(/[^0-9+]/g, "")}`}>{s(data, "cta.phone", "")}</a>
          </p>
        </section>
      </main>

      <footer>
        <div className="wrap legal">
          <span>© 2026 Wayne's Western Woodworking · Handbuilt in Idaho</span>
          <span>
            <a href={`mailto:${s(data, "cta.email", "")}`}>{s(data, "cta.email", "")}</a>
            {" · "}
            <a href={`tel:${s(data, "cta.phone", "").replace(/[^0-9+]/g, "")}`}>{s(data, "cta.phone", "")}</a>
          </span>
        </div>
      </footer>
    </>
  );
}

function QuoteSection() {
  const submit = useServerFn(submitLead);
  const [done, setDone] = useState(false);
  const m = useMutation({
    mutationFn: (v: any) => submit({ data: v }),
    onSuccess: () => setDone(true),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dimensions = (fd.get("dimensions") as string) || "";
    const timeline = (fd.get("timeline") as string) || "";
    const budget = (fd.get("budget") as string) || "";
    const details = (fd.get("details") as string) || "";
    const composed = [
      dimensions && `Dimensions: ${dimensions}`,
      timeline && `Timeline: ${timeline}`,
      budget && `Budget: ${budget}`,
      details && `\n${details}`,
    ].filter(Boolean).join("\n");

    m.mutate({
      name: fd.get("name") as string,
      email: (fd.get("email") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      project_type: (fd.get("project_type") as string) || undefined,
      message: composed || undefined,
    });
  }

  return (
    <section id="quote" className="section quote-section">
      <div className="wrap">
        <div className="quote">
          <h3>Request a quote</h3>
          <p className="q-sub">Send the project details and Kaden will come back with a quote. Direct communication from start to finish.</p>
          {done ? (
            <div className="form" style={{ padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 18 }}><b>Thanks — your request is in.</b></p>
              <p style={{ opacity: 0.7 }}>Kaden will reach out within 1–2 business days.</p>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <div className="field"><label>Name</label><input name="name" type="text" required placeholder="Your name" /></div>
              <div className="field"><label>Email</label><input name="email" type="email" required placeholder="you@email.com" /></div>
              <div className="field"><label>Phone</label><input name="phone" type="tel" required placeholder="(208) 555-0000" /></div>
              <div className="field">
                <label>Project type</label>
                <select name="project_type" defaultValue="">
                  <option value="" disabled>Select one</option>
                  <option>Custom Furniture</option>
                  <option>Restaurant Tables</option>
                  <option>Bar Tops</option>
                  <option>Community Tables</option>
                  <option>Point of Sale Counters</option>
                  <option>Commercial Woodworking</option>
                  <option>Residential Woodworking</option>
                  <option>Something else</option>
                </select>
              </div>
              <div className="field"><label>Rough dimensions</label><input name="dimensions" type="text" placeholder="e.g. 10 ft × 30 in" /></div>
              <div className="field"><label>Timeline</label><input name="timeline" type="text" placeholder="When do you need it?" /></div>
              <div className="field full"><label>Budget range</label><input name="budget" type="text" placeholder="USD (optional)" /></div>
              <div className="field full"><label>Details</label><textarea name="details" placeholder="Tell us about the space and the build."></textarea></div>
              <div className="field full q-cta">
                <button type="submit" className="btn" disabled={m.isPending}>
                  {m.isPending ? "Sending…" : "Request a quote"}
                </button>
                <span className="q-note">{m.isError ? "Something went wrong. Try again." : "We'll respond within 1–2 business days."}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
