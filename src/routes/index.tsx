import { createFileRoute } from "@tanstack/react-router";
import work01 from "@/assets/work-01.jpg";
import work02 from "@/assets/work-02.jpg";
import work03 from "@/assets/work-03.jpg";
import work04 from "@/assets/work-04.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
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
            <div className="tile wide">
              <div className="frame"><img src={work01} alt="Retail checkout counter in torched fir with steel base" width={1280} height={960} /></div>
              <div className="spec">
                <span className="no">№ 01</span>
                <span className="meta"><b>Retail checkout counter</b><span className="det">Torched fir top · steel base · Idaho Livin, Boise</span></span>
              </div>
            </div>
            <div className="tile narrow">
              <div className="frame tall"><img src={work02} alt="Charred fir bar-top detail with hand-rubbed oil" width={960} height={1280} loading="lazy" /></div>
              <div className="spec">
                <span className="no">№ 02</span>
                <span className="meta"><b>Bar-top detail</b><span className="det">Shou sugi ban fir · hand-rubbed oil</span></span>
              </div>
            </div>
            <div className="tile narrow">
              <div className="frame tall"><img src={work04} alt="Floating wall-mounted display shelving in stained fir" width={960} height={1280} loading="lazy" /></div>
              <div className="spec">
                <span className="no">№ 03</span>
                <span className="meta"><b>Floating display shelving</b><span className="det">Stained fir · wall-mounted · retail fixture</span></span>
              </div>
            </div>
            <div className="tile wide">
              <div className="frame"><img src={work03} alt="Wrap-around charred fir counter with blackened panel" width={1280} height={960} loading="lazy" /></div>
              <div className="spec">
                <span className="no">№ 04</span>
                <span className="meta"><b>Wrap-around counter</b><span className="det">Charred fir · blackened panel · Idaho Livin</span></span>
              </div>
            </div>
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
            <div className="step">
              <div className="num">01</div>
              <p>Tell us the space — dimensions, how it gets used, and the look you're after.</p>
            </div>
            <div className="step">
              <div className="num">02</div>
              <p>We quote the build and lock a timeline. No templates, no middlemen.</p>
            </div>
            <div className="step">
              <div className="num">03</div>
              <p>A 50% deposit holds your spot on the bench. We build it, you install it.</p>
            </div>
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

      <section id="quote" className="section">
        <div className="wrap">
          <div className="quote">
            <h3>Have a space that needs something built?</h3>
            <p className="q-sub">Send the details and we'll come back with a quote. A 50% deposit reserves your build.</p>
            <form className="form" onSubmit={(e) => e.preventDefault()}>
              <div className="field"><label>Name</label><input type="text" placeholder="Your name" /></div>
              <div className="field"><label>Email</label><input type="email" placeholder="you@email.com" /></div>
              <div className="field"><label>Phone</label><input type="tel" placeholder="(208) 555-0000" /></div>
              <div className="field">
                <label>Project type</label>
                <select defaultValue="">
                  <option value="" disabled>Select one</option>
                  <option>Counter / POS</option>
                  <option>Tabletop / bar top</option>
                  <option>Retail shelving</option>
                  <option>Seating / bench</option>
                  <option>Signage / frame</option>
                  <option>Something else</option>
                </select>
              </div>
              <div className="field"><label>Rough dimensions</label><input type="text" placeholder="e.g. 10 ft × 30 in" /></div>
              <div className="field"><label>Wood / finish</label><input type="text" placeholder="e.g. torched fir" /></div>
              <div className="field"><label>Timeline</label><input type="text" placeholder="When do you need it?" /></div>
              <div className="field"><label>Budget range</label><input type="text" placeholder="USD" /></div>
              <div className="field full"><label>Details</label><textarea placeholder="Tell us about the space and the build."></textarea></div>
              <div className="field full q-cta">
                <button type="submit" className="btn">Request a quote</button>
                <span className="q-note">Add reference photos after you submit — it helps us quote faster.</span>
              </div>
            </form>
          </div>
        </div>
      </section>

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
