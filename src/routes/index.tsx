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
            <a href="#work" className="txt">Work</a>
            <a href="#process" className="txt">Process</a>
            <a href="#about" className="txt">About</a>
            <a href="#quote" className="pill">Request a quote</a>
          </div>
        </div>
      </nav>

      <header id="top" className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="mono eyebrow">Wayne's Western Woodworking — Boise, Idaho</div>
            <h1 className="statement">Handbuilt counters, tables, and fixtures. <em>Built to outlast the room.</em></h1>
            <p className="hero-sub">Custom woodwork for retail floors, restaurants, and homes — milled, charred, and finished by hand in Idaho.</p>
          </div>
          <div className="lists">
            <div className="list">
              <h4>Builds</h4>
              <ul>
                <li>Counters & POS</li>
                <li>Tabletops & bar tops</li>
                <li>Retail shelving</li>
                <li>Seating & benches</li>
                <li>Signage & frames</li>
              </ul>
            </div>
            <div className="list">
              <h4>Finishes</h4>
              <ul>
                <li>Torched fir</li>
                <li>White oak</li>
                <li>Walnut</li>
                <li>Blackened steel</li>
                <li>Hand-rubbed oil</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <section id="work" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Selected Work</h2>
            <span className="mono">Idaho — 2023–2025</span>
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

      <section id="process" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>How a build works</h2>
            <span className="mono">Three steps</span>
          </div>
          <div className="process">
            <div className="step"><div className="num">01</div><p>Tell us the space — dimensions, how it gets used, and the look you're after.</p></div>
            <div className="step"><div className="num">02</div><p>We quote the build and lock a timeline. No templates, no middlemen.</p></div>
            <div className="step"><div className="num">03</div><p>A 50% deposit holds your spot on the bench. We build it, you install it.</p></div>
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>Trusted by</h2>
            <span className="mono">Recent clients</span>
          </div>
          <div className="clients-row">
            <span className="client anchor">Idaho Livin</span>
            <span className="client ph">Boise Mercantile</span>
            <span className="client ph">Sawtooth Coffee</span>
            <span className="client ph">Foothills Barber Co.</span>
            <span className="client ph">North End Provisions</span>
          </div>
          <p className="clients-note">Built the counters, fixtures & displays for shops across the Treasure Valley.</p>
        </div>
      </section>

      <QuoteSection />

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">Wayne's Western Woodworking<small>Handbuilt in Idaho · Est. 2019</small></div>
            <div className="foot-col">
              <h5>Contact</h5>
              <a href="mailto:hello@wayneswestern.co">hello@wayneswestern.co</a>
              <a href="tel:+12085550117">(208) 555-0117</a>
              <p>Boise, Idaho</p>
            </div>
            <div className="foot-col">
              <h5>Index</h5>
              <a href="#work">Work</a>
              <a href="#process">Process</a>
              <a href="#about">Clients</a>
              <a href="#quote">Request a quote</a>
            </div>
          </div>
          <div className="legal">
            <span>© 2025 Wayne's Western Woodworking</span>
            <span>Genuine wood · Genuine work</span>
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
