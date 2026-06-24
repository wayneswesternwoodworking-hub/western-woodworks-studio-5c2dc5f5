import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPublicPhotos } from "@/lib/photos.functions";
import { submitLead } from "@/lib/leads.functions";
import work01 from "@/assets/work-01.jpg";
import work02 from "@/assets/work-02.jpg";
import work03 from "@/assets/work-03.jpg";
import work04 from "@/assets/work-04.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const PLACEHOLDERS = [
  { id: "p1", url: work01, title: "Retail checkout counter", caption: "Torched fir top · steel base · Idaho Livin, Boise" },
  { id: "p2", url: work02, title: "Bar-top detail", caption: "Shou sugi ban fir · hand-rubbed oil" },
  { id: "p3", url: work04, title: "Floating display shelving", caption: "Stained fir · wall-mounted · retail fixture" },
  { id: "p4", url: work03, title: "Wrap-around counter", caption: "Charred fir · blackened panel · Idaho Livin" },
];

function Index() {
  const fetchPhotos = useServerFn(listPublicPhotos);
  const { data: photos } = useQuery({
    queryKey: ["public-photos"],
    queryFn: () => fetchPhotos(),
  });
  const list = photos && photos.length > 0 ? photos : PLACEHOLDERS;

  return (
    <>
      <nav className="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="brand">Wayne's Western <span>Woodworking</span></a>
          <div className="nav-links">
            <a href="#work" className="txt">Concepts</a>
            <a href="#services" className="txt">Services</a>
            <a href="#why" className="txt">Why us</a>
            <a href="#quote" className="pill">Request a quote</a>
          </div>
        </div>
      </nav>

      <header id="top" className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="mono eyebrow">About Wayne's Western Woodworking — Idaho</div>
            <h1 className="statement">Handcrafted Furniture <em>Built to Last.</em></h1>
            <p className="hero-sub">
              Custom-built furniture and commercial woodworking — restaurant tables, countertops,
              retail fixtures, and residential pieces, each one designed and built with an emphasis
              on durability, craftsmanship, and attention to detail.
            </p>
          </div>
          <div className="lists">
            <div className="list">
              <h4>Built for</h4>
              <ul>
                <li>Restaurants</li>
                <li>Retail floors</li>
                <li>Bars & cafés</li>
                <li>Offices</li>
                <li>Homes</li>
              </ul>
            </div>
            <div className="list">
              <h4>Based in</h4>
              <ul>
                <li>Idaho</li>
                <li>Built locally</li>
                <li>Solid wood</li>
                <li>Commercial-grade</li>
                <li>Made to last</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <section id="services" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Services</h2>
            <span className="mono">What we build</span>
          </div>
          <div className="services-grid">
            {[
              "Custom Furniture",
              "Restaurant Tables",
              "Bar Tops",
              "Community Tables",
              "Point of Sale Counters",
              "Commercial Woodworking",
              "Residential Woodworking",
            ].map((s) => (
              <div key={s} className="service">
                <span className="check">✓</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Concepts</h2>
            <span className="mono">Selected work</span>
          </div>
          <div className="grid">
            {list.map((p, i) => {
              const wide = i % 2 === 0;
              return (
                <div key={p.id} className={`tile ${wide ? "wide" : "narrow"}`}>
                  <div className={`frame ${wide ? "" : "tall"}`}>
                    <img src={p.url} alt={p.title} loading={i > 0 ? "lazy" : undefined} />
                  </div>
                  <div className="spec">
                    <span className="no">№ {String(i + 1).padStart(2, "0")}</span>
                    <span className="meta">
                      <b>{p.title || "Untitled"}</b>
                      {p.caption && <span className="det">{p.caption}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Why Clients Choose Wayne's</h2>
            <span className="mono">What sets the work apart</span>
          </div>
          <div className="why-grid">
            {[
              "Custom-built to fit your space",
              "Solid wood construction",
              "Locally built in Idaho",
              "Commercial-grade finishes",
              "Direct communication from start to finish",
              "Pride in craftsmanship and attention to every detail",
            ].map((w) => (
              <div key={w} className="why-item">
                <span className="check">✓</span>
                <p>{w}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuoteSection />

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">Wayne's Western Woodworking<small>Handbuilt in Idaho</small></div>
            <div className="foot-col">
              <h5>Contact</h5>
              <p>Kaden Stutzman</p>
              <a href="mailto:wayneswesternwoodworking@gmail.com">wayneswesternwoodworking@gmail.com</a>
              <a href="tel:+12089611863">(208) 961-1863</a>
            </div>
            <div className="foot-col">
              <h5>Index</h5>
              <a href="#services">Services</a>
              <a href="#work">Concepts</a>
              <a href="#why">Why us</a>
              <a href="#quote">Request a quote</a>
            </div>
          </div>
          <div className="legal">
            <span>© 2026 Wayne's Western Woodworking</span>
            <span>Let's build something unique</span>
          </div>
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
    const wood = (fd.get("wood") as string) || "";
    const timeline = (fd.get("timeline") as string) || "";
    const budget = (fd.get("budget") as string) || "";
    const details = (fd.get("details") as string) || "";
    const composed = [
      dimensions && `Dimensions: ${dimensions}`,
      wood && `Wood/finish: ${wood}`,
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
    <section id="quote" className="section">
      <div className="wrap">
        <div className="quote">
          <h3>Have a space that needs something built?</h3>
          <p className="q-sub">Send the details and we'll come back with a quote. A 50% deposit reserves your build.</p>
          {done ? (
            <div className="form" style={{ padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 18 }}><b>Thanks — your request is in.</b></p>
              <p style={{ opacity: 0.7 }}>Wayne will reach out within 1–2 business days.</p>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <div className="field"><label>Name</label><input name="name" type="text" required placeholder="Your name" /></div>
              <div className="field"><label>Email</label><input name="email" type="email" placeholder="you@email.com" /></div>
              <div className="field"><label>Phone</label><input name="phone" type="tel" placeholder="(208) 555-0000" /></div>
              <div className="field">
                <label>Project type</label>
                <select name="project_type" defaultValue="">
                  <option value="" disabled>Select one</option>
                  <option>Counter / POS</option>
                  <option>Tabletop / bar top</option>
                  <option>Retail shelving</option>
                  <option>Seating / bench</option>
                  <option>Signage / frame</option>
                  <option>Something else</option>
                </select>
              </div>
              <div className="field"><label>Rough dimensions</label><input name="dimensions" type="text" placeholder="e.g. 10 ft × 30 in" /></div>
              <div className="field"><label>Wood / finish</label><input name="wood" type="text" placeholder="e.g. torched fir" /></div>
              <div className="field"><label>Timeline</label><input name="timeline" type="text" placeholder="When do you need it?" /></div>
              <div className="field"><label>Budget range</label><input name="budget" type="text" placeholder="USD" /></div>
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
