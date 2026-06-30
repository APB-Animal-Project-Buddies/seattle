import type { Metadata } from "next";
import "./aotm.css";

export const metadata: Metadata = {
  title: "Ahead of the Menu — plant-based food for everyone",
  description:
    "Let's make food where everyone eats. Inclusive, creative, sustainable, and ethical food choices for a better future.",
};

export default function AheadOfTheMenu() {
  return (
    <main className="aotm">
      <header className="aotm-top">
        <span className="aotm-brand">
          <svg className="leaf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
          Ahead of the Menu
        </span>
      </header>

      <section className="aotm-hero">
        <div className="aotm-copy">
          <span className="aotm-eyebrow">Plant-based · Inclusive · Sustainable</span>

          <h1 className="aotm-title">
            <span>Ahead of</span>
            <span>the <em className="accent">Menu</em></span>
          </h1>

          <p className="aotm-lede">Let&rsquo;s make food where everyone eats.</p>
          <p className="aotm-sub">
            Inclusive, <span className="aotm-fire">creative</span>, sustainable, and ethical food choices for a better future.
          </p>

          <nav className="aotm-paths" aria-label="Choose your path">
            <a className="aotm-card" href="/aheadofthemenu/recipes">
              <span className="aotm-card-num">01</span>
              <span className="aotm-card-body">
                <span className="who">For restaurateurs &amp; chefs</span>
                <span className="what">Recipes &amp; Menus</span>
                <span className="desc">Line-tested plant-based recipes engineered for service.</span>
              </span>
              <span className="aotm-card-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </a>

            <a className="aotm-card" href="/aheadofthemenu/dishes">
              <span className="aotm-card-num">02</span>
              <span className="aotm-card-body">
                <span className="who">For home cooks &amp; everyone</span>
                <span className="what">Dishes</span>
                <span className="desc">Discover and make crowd-pleasing plant-based dishes at home.</span>
              </span>
              <span className="aotm-card-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </a>
          </nav>
        </div>

        <div className="aotm-stage">
          <div className="aotm-frame">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/aheadofthemenu/assets/hero-poster.jpg"
            >
              <source src="/aheadofthemenu/assets/hero.webm" type="video/webm" />
              <source src="/aheadofthemenu/assets/hero.mp4" type="video/mp4" />
            </video>
            <span className="aotm-tag"><span className="dot" />Now cooking</span>
          </div>
        </div>
      </section>

      <a className="aotm-powered" href="/" title="Animal Project Buddies">
        powered by <b>Animal Project Buddies</b>
      </a>
    </main>
  );
}
