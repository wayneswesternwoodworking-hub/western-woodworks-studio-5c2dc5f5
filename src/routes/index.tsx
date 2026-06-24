import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { submitLead } from "@/lib/leads.functions";
import mainTop from "@/assets/canva-main-top.png.asset.json";
import infographics from "@/assets/canva-infographics.png.asset.json";
import cta from "@/assets/canva-cta.png.asset.json";

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
            <a href="#quote" className="pill">Request a quote</a>
          </div>
        </div>
      </nav>

      <main id="top" className="canva-page">
        <img src={mainTop.url} alt="Wayne's Western Woodworking — handcrafted furniture built to last. Services and why clients choose us." />
        <img src={infographics.url} alt="Concepts — restaurant table plans, floating displays and shelves, and finish options." loading="lazy" />
        <QuoteSection />
        <img src={cta.url} alt="Let's build something unique — contact Kaden Stutzman at wayneswesternwoodworking@gmail.com or (208) 961-1863." loading="lazy" />
      </main>

      <footer>
        <div className="wrap legal">
          <span>© 2026 Wayne's Western Woodworking · Handbuilt in Idaho</span>
          <span>
            <a href="mailto:wayneswesternwoodworking@gmail.com">wayneswesternwoodworking@gmail.com</a>
            {" · "}
            <a href="tel:+12089611863">(208) 961-1863</a>
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
          <p className="q-sub">
            Send the project details and Kaden will come back with a quote. Direct communication from start to finish.
          </p>
          {done ? (
            <div className="form" style={{ padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 18 }}><b>Thanks — your request is in.</b></p>
              <p style={{ opacity: 0.7 }}>Kaden will reach out within 1–2 business days.</p>
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
