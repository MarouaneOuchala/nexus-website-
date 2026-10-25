"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import PackageConfigurator from "@/components/PackageConfigurator";
import InteractiveScene from "@/components/InteractiveScene";
import { useSettings } from "@/components/SettingsProvider";
import { enquiryCopy } from "@/lib/enquiries";
import { languages, type Lang } from "@/lib/i18n";

const programImages = [
  "https://images.pexels.com/photos/5866468/pexels-photo-5866468.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/19893586/pexels-photo-19893586/free-photo-of-interior-design-in-modern-office.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/38209616/pexels-photo-38209616/free-photo-of-modern-architecture-in-casablanca-morocco.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/38209616/pexels-photo-38209616/free-photo-of-modern-architecture-in-casablanca-morocco.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/29735561/pexels-photo-29735561/free-photo-of-modern-skyline-of-casablanca-with-moroccan-flags.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/19893586/pexels-photo-19893586/free-photo-of-interior-design-in-modern-office.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const PROGRAMS_PER_PAGE = 3;

function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      ↗
    </span>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={line}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

function SunIcon() {
  return (
    <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function Home() {
  const { t, lang, setLang, theme, toggleTheme, isRtl } = useSettings();
  const [programPage, setProgramPage] = useState(0);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".package-heading, .calc-card, .obstacle-visual, .obstacle-copy, .mid-cta-inner, .section-heading, .program-item, .why-visual, .why-copy, .getting-started-heading, .getting-started-step, .career-banner, .faq-heading, .faq-list details, .contact-copy, .inquiry-form",
      ),
    );
    const revealAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -32px 0px" },
    );
    targets.forEach((target) => {
      target.classList.add("editorial-reveal");
      observer.observe(target);
    });

    return () => {
      observer.disconnect();
    };
  }, [lang, programPage]);

  const a = t.a11y;
  const h = t.hero;
  const ct = t.contact;
  const programCount = t.programs.items.length;
  const programPageCount = Math.ceil(programCount / PROGRAMS_PER_PAGE);
  const visiblePrograms = t.programs.items
    .map((item, index) => ({ ...item, index }))
    .slice(programPage * PROGRAMS_PER_PAGE, programPage * PROGRAMS_PER_PAGE + PROGRAMS_PER_PAGE);
  const navLinks = [
    { href: "#accueil", label: t.nav.home },
    { href: "#programmes", label: t.nav.courses },
    { href: "#carrieres", label: t.nav.careers },
    { href: "#faq", label: t.nav.faqs },
    { href: "#steps", label: t.nav.howItWorks },
  ];

  return (
    <main className="nexus-page">
      <InteractiveScene />
      <header className="sticky-header">
        <div className="editorial-progress" aria-hidden="true" />
        <div className="site-header">
          <a className="wordmark" href="#accueil" aria-label={a.home}>
            <span className="wordmark-icon" aria-hidden="true">
              N
            </span>
            <span>
              NEXUS<span className="wordmark-period">.</span>
            </span>
            <span className="cap-mark" aria-hidden="true">
              ✦
            </span>
          </a>
          <nav className="desktop-nav" aria-label={a.mainNav}>
            {navLinks.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <div className="lang-switch">
              <GlobeIcon />
              <select aria-label={a.language} value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
                {languages.map((language) => (
                  <option key={language.code} value={language.code} lang={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? a.switchToLight : a.switchToDark}>
              <MoonIcon />
              <SunIcon />
            </button>
            <a className="button button-small button-primary header-cta" href="#forfaits">
              {t.nav.packCta} <Arrow />
            </a>
          </div>
          <details className="mobile-nav">
            <summary aria-label={a.openMenu}>
              <span></span>
              <span></span>
            </summary>
            <nav aria-label={a.mobileNav}>
              {navLinks.map((link) => (
                <a href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
                <a href="#forfaits">{t.nav.packCta}</a>
                <a href="#contact">{t.nav.contact}</a>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero section-shell" id="accueil">
        <div className="executive-intro">
          <div className="executive-title">
            <p className="eyebrow">
              <span className="eyebrow-line"></span> {h.eyebrow}
            </p>
            <h1>
              <span className="editorial-title-line"><span>{h.titleLead}</span></span>{" "}
              <span className="editorial-title-line editorial-title-accent"><span>{h.titleHighlight}</span></span>
            </h1>
          </div>
          <div className="hero-copy">
            <p className="hero-description">{h.description}</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#forfaits">
                {h.start} <Arrow />
              </a>
              <a className="button button-outline" href="#programmes">
                {h.programs}
              </a>
            </div>
            <p className="hero-price-note">{h.priceNote}</p>
          </div>
        </div>
        <div className="executive-stage">
          <div className="hero-visual">
            <div className="scene-mount" aria-hidden="true">
              <svg className="scene-fallback" viewBox="0 0 600 360" fill="none">
                <rect x="36" y="10" width="528" height="310" fill="#e9bea9" stroke="#b6636c" strokeWidth="8" />
                <path d="M80 50h55v135H80Zm385 0h55v135h-55Z" fill="#aecabc" stroke="#fff0d0" strokeWidth="6" />
                <circle cx="300" cy="32" r="15" fill="#fff0d0" stroke="#934e55" strokeWidth="2" />
                <path d="M300 21v11h9" stroke="#49695c" strokeWidth="2" />
                <rect x="170" y="60" width="260" height="135" fill="#30564e" stroke="#e4b653" strokeWidth="4" />
                <path d="M195 85h100M195 103h65" stroke="#fff0d0" strokeWidth="5" />
                <path d="M210 170v-30m45 30v-45m45 45v-60m45 60V100" stroke="#e4b653" strokeWidth="18" />
                <path d="M105 250 290 185 510 260 325 335Z" fill="#c98288" stroke="#934e55" strokeWidth="3" />
                <path d="M125 260v40m360-30v35m-160 10v30" stroke="#49695c" strokeWidth="9" />
                <path d="m160 235 55-17 40 18-55 17Z" fill="#fff0d0" />
                <path d="m160 235-6-48 58-17 3 48Z" fill="#30564e" stroke="#c98288" strokeWidth="3" />
                <path d="m340 250 55-17 40 18-55 17Z" fill="#fff0d0" />
                <path d="m340 250-6-48 58-17 3 48Z" fill="#30564e" stroke="#c98288" strokeWidth="3" />
                <path d="m263 263 26-9 30 11-26 10Z" fill="#fff0d0" />
              </svg>
            </div>
            <div className="visual-label">
              <i></i> NEXUS / LIVE ENGLISH
            </div>
            <div className="visual-caption">
              <span>{h.caption1}</span>
              <span>{h.caption2}</span>
            </div>
          </div>
          <aside className="executive-brief">
            <p className="brief-kicker">{h.agendaLabel}</p>
            <h2>{h.agendaTitle}</h2>
            <ol>
              {h.agendaItems.map((item, index) => (
                <li key={item}><span aria-hidden="true">0{index + 1}</span>{item}<Arrow /></li>
              ))}
            </ol>
            <div className="brief-format"><strong>1:1</strong><span>{h.formatLabel}</span></div>
            <a href="#contact">{h.consultation}<Arrow /></a>
          </aside>
        </div>
        <ul className="hero-benefits">
          {h.benefits.map((benefit) => (
            <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>
          ))}
        </ul>
      </section>

      <div className="kinetic-strip" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy}><span>{h.agendaItems[0]}</span><i>↗</i><span>{h.agendaItems[1]}</span><i>↗</i><span>{h.agendaItems[2]}</span><i>↗</i></div>
        ))}
      </div>

      <section className="obstacle-section section-shell" id="methode">
        <div className="obstacle-visual" role="img" aria-label={a.workspaceVisual}>
          <span className="obstacle-photo-index">{t.obstacle.photoIndex}</span>
          <span className="obstacle-photo-caption">{t.obstacle.photoCaption}</span>
        </div>
        <div className="obstacle-copy">
          <p className="section-tag">{t.obstacle.tag}</p>
          <h2>
            {t.obstacle.titleLead}
            <br />
            <span>{t.obstacle.titleHighlight}</span>
          </h2>
          <p className="section-intro">{t.obstacle.intro}</p>
          <ul className="check-list">
            {t.obstacle.points.map((point) => (
              <li key={point.title}>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>{point.title}</strong>
                  <small>{point.text}</small>
                </div>
              </li>
            ))}
          </ul>
          <a className="button button-primary" href="#forfaits">
            {t.obstacle.cta} <Arrow />
          </a>
        </div>
      </section>

      <section className="mid-cta">
        <div className="mid-cta-inner">
          <span className="mid-cta-tag">{t.midCta.tag}</span>
          <h2>
            <Lines lines={t.midCta.title} />
          </h2>
          <a className="button button-warm" href="#programmes">
            {t.midCta.cta} <Arrow />
          </a>
        </div>
        <span className="mid-cta-shape mid-cta-shape-one"></span>
        <span className="mid-cta-shape mid-cta-shape-two"></span>
      </section>

      <section className="section-shell programs-section" id="programmes">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line"></span> {t.programs.eyebrow}
            </p>
            <h2>
              {t.programs.titleLead}
              <br />
              <span>{t.programs.titleHighlight}</span>
            </h2>
          </div>
          <a className="view-all-link" href="#contact">
            {t.programs.viewAll} <Arrow />
          </a>
        </div>
        <p className="section-intro programs-intro">{t.programs.intro}</p>
        <div className="program-grid" aria-live="polite">
          {visiblePrograms.map((program) => (
            <article className="program-item" key={program.index}>
              <div className="program-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover object-[50%_25%] transition-transform duration-500 hover:scale-105"
                  src={programImages[program.index]}
                  alt=""
                  loading="lazy"
                />
                <span>{program.tag}</span>
              </div>
              <div className="program-card-copy">
                <div className="program-topline">
                  <span>
                    {t.programs.programLabel} {String(program.index + 1).padStart(2, "0")}
                  </span>
                  <Arrow />
                </div>
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <a className="button button-warm program-cta" href="#contact" data-enquiry-type="course-info" data-enquiry-goal={program.title} aria-label={a.programInfo(program.title)}>
                  {t.programs.cta} <Arrow />
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="carousel-controls">
          <button type="button" aria-label={a.previousPrograms} onClick={() => setProgramPage((current) => Math.max(0, current - 1))} disabled={programPage === 0}>
            {isRtl ? "→" : "←"}
          </button>
          <span>
            {Array.from({ length: programPageCount }, (_, index) => (
              <button
                className={programPage === index ? "is-current" : ""}
                key={index}
                type="button"
                aria-label={a.programSet(index + 1)}
                aria-current={programPage === index ? "page" : undefined}
                onClick={() => setProgramPage(index)}
              />
            ))}
          </span>
          <button
            type="button"
            aria-label={a.nextPrograms}
            onClick={() => setProgramPage((current) => Math.min(programPageCount - 1, current + 1))}
            disabled={programPage === programPageCount - 1}
          >
            {isRtl ? "←" : "→"}
          </button>
        </div>
      </section>

      <PackageConfigurator />

      <section className="why-section">
        <div className="section-shell why-layout">
          <div className="why-visual" role="img" aria-label={a.whyVisual}>
            <div className="why-photo"></div>
            <span className="why-bubble">
              <Lines lines={t.why.bubble.slice(0, 2)} />
              <br />
              <b>{t.why.bubble[2]}</b>
            </span>
            <span className="why-seal">
              {t.why.seal[0]}
              <br />
              <b>{t.why.seal[1]}</b>
            </span>
          </div>
          <div className="why-copy">
            <p className="section-tag">{t.why.tag}</p>
            <h2>
              {t.why.titleLead}
              <br />
              <span>{t.why.titleHighlight}</span>
            </h2>
            <p className="section-intro">{t.why.intro}</p>
            <ul className="check-list why-list">
              {t.why.items.map((item) => (
                <li key={item.title}>
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </div>
                </li>
              ))}
            </ul>
            <a className="button button-primary" href="#contact">
              {t.why.cta} <Arrow />
            </a>
          </div>
        </div>
      </section>

      <section className="getting-started-section section-shell" id="steps">
        <div className="getting-started-heading">
          <p className="section-tag">{t.gettingStarted.tag}</p>
          <h2>
            {t.gettingStarted.title[0]}
            <br />
            <span>{t.gettingStarted.title[1]}</span>
          </h2>
          <p>{t.gettingStarted.intro}</p>
          <a className="button button-primary" href="#forfaits">
            {t.gettingStarted.cta} <Arrow />
          </a>
        </div>
        <ol className="getting-started-steps">
          {t.gettingStarted.steps.map((step, index) => (
            <li className="getting-started-step" key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="career-section section-shell" id="carrieres">
        <div className="career-banner">
          <div className="career-copy">
            <p className="section-tag">{t.careers.tag}</p>
            <h2>
              <Lines lines={t.careers.title} />
            </h2>
            <p>{t.careers.text}</p>
            <a className="button button-warm" href="#contact" data-enquiry-type="application">
              {t.careers.cta} <Arrow />
            </a>
          </div>
          <div className="career-art" role="img" aria-label={a.whyVisual}>
            <span>{t.footer.location}</span>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-shell faq-layout">
          <div className="faq-heading">
            <p className="section-tag">＋ {t.faq.tag}</p>
            <h2>
              {t.faq.titleLead}
              <br />
              <span>{t.faq.titleHighlight}</span>
            </h2>
            <p className="faq-aside">{t.faq.aside}</p>
            <a className="text-link" href="#contact">
              {t.faq.contactLink} <Arrow />
            </a>
          </div>
          <div className="faq-list">
            {t.faq.items.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary>
                  <span>{faq.question}</span>
                  <span className="faq-toggle" aria-hidden="true"></span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="section-shell contact-layout">
          <div className="contact-copy">
            <p className="eyebrow eyebrow-light">
              <span className="eyebrow-line"></span> {ct.eyebrow}
            </p>
            <h2>
              {ct.titleLead}
              <br />
              <span>{ct.titleHighlight}</span>
            </h2>
            <p>{ct.text}</p>
            <div className="contact-aside">
              <span className="contact-aside-mark">N.</span>
              <span>{ct.aside}</span>
            </div>
          </div>
          <div className="contact-callback">
            <p>{enquiryCopy[lang].intro}</p>
            <a className="button button-primary" href="#contact">{enquiryCopy[lang].open} <Arrow /></a>
            <p>{enquiryCopy[lang].disclaimer}</p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-main">
          <a className="wordmark footer-wordmark" href="#accueil">
            <span className="wordmark-icon" aria-hidden="true">
              N
            </span>
            <span>
              NEXUS<span className="wordmark-period">.</span>
            </span>
          </a>
          <p>
            <Lines lines={t.footer.tagline} />
          </p>
          <nav aria-label={a.footerNav}>
            <a href="#programmes">{t.footer.nav.courses}</a>
            <a href="#forfaits">{t.footer.nav.packs}</a>
            <a href="#faq">{t.footer.nav.faq}</a>
            <a href="#contact">{t.footer.nav.contact}</a>
          </nav>
          <span className="footer-location">{t.footer.location}</span>
        </div>
        <div className="section-shell footer-bottom">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.legal}</span>
          <Link href="/admin/">{enquiryCopy[lang].admin}</Link>
          <a href="#accueil">{t.footer.top}</a>
        </div>
      </footer>
    </main>
  );
}
