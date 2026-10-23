"use client";

import { Fragment, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import PackageConfigurator from "@/components/PackageConfigurator";
import { useSettings } from "@/components/SettingsProvider";
import { BASE_PATH } from "@/lib/config";
import { languages, type Lang } from "@/lib/i18n";

const programImages = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
];

const PROGRAMS_PER_PAGE = 3;
const levelCodes = ["A1", "A2", "B1", "B2", "C1"];

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
  const [requestType, setRequestType] = useState("consultation");
  const [formMessage, setFormMessage] = useState("");
  const [programPage, setProgramPage] = useState(0);
  const [activeHeroLevel, setActiveHeroLevel] = useState("A1");

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".benefit-strip, .obstacle-section, .mid-cta, .programs-section, .why-section, .reviews-section, .career-section, .faq-section, .contact-section, .package-section",
      ),
    );
    const revealAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    document.documentElement.classList.add("has-scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveal");
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const inbox = process.env.NEXT_PUBLIC_NEXUS_INQUIRY_EMAIL;
    if (!inbox) {
      setFormMessage(t.contact.noInbox);
      return;
    }
    const values = new FormData(event.currentTarget);
    const body = Array.from(values.entries())
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
    const subject = requestType === "application" ? t.contact.subjectApplication : t.contact.subjectConsultation;
    window.location.href = `mailto:${inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setFormMessage(t.contact.opened);
  }

  const a = t.a11y;
  const h = t.hero;
  const ct = t.contact;
  const programCount = t.programs.items.length;
  const programPageCount = Math.ceil(programCount / PROGRAMS_PER_PAGE);
  const visiblePrograms = t.programs.items
    .map((item, index) => ({ ...item, index }))
    .slice(programPage * PROGRAMS_PER_PAGE, programPage * PROGRAMS_PER_PAGE + PROGRAMS_PER_PAGE);
  const heroGoal = h.levels.find(({ level }) => level === activeHeroLevel)?.goal;
  const navLinks = [
    { href: "#accueil", label: t.nav.home },
    { href: "#programmes", label: t.nav.courses },
    { href: "#carrieres", label: t.nav.careers },
    { href: "#faq", label: t.nav.faqs },
    { href: "#avis", label: t.nav.archives },
  ];

  return (
    <main className="nexus-page">
      <header className="sticky-header">
        <div className="announcement">
          <span className="announcement-offer">
            <span aria-hidden="true">⚡</span> {t.announcement.offer}
          </span>
          <span className="announcement-deal">
            {t.announcement.deal} <strong>{t.announcement.dealStrong}</strong>
          </span>
          <span className="announcement-availability">
            <i></i> {t.announcement.availability}
          </span>
        </div>
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
            <a className="button button-small button-primary header-cta" href="#contact">
              {t.nav.contact} <Arrow />
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
              <a href="#contact">{t.nav.contact}</a>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero section-shell" id="accueil" style={{ "--hero-image": `url("${BASE_PATH}/assets/hero-bg.jpg")` } as CSSProperties}>
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line"></span> {h.eyebrow}
          </p>
          <h1>
            {h.titleLead}
            <br />
            <span>{h.titleHighlight}</span>
          </h1>
          <p className="hero-description">{h.description}</p>
          <ul className="hero-benefits">
            {h.benefits.map((benefit) => (
              <li key={benefit}>
                <span aria-hidden="true">✓</span> {benefit}
              </li>
            ))}
          </ul>
          <div className="hero-actions">
            <a className="button button-primary" href="#forfaits">
              {h.start} <Arrow />
            </a>
            <a className="button button-outline" href="#programmes">
              {h.programs}
            </a>
          </div>
          <div className="hero-levels">
            <span>{h.levelsLabel}</span>
            <div className="level-track" role="group" aria-label={a.levelGroup}>
              {levelCodes.map((level) => (
                <button
                  className={`level-chip ${activeHeroLevel === level ? "is-active" : ""}`}
                  key={level}
                  type="button"
                  onClick={() => setActiveHeroLevel(level)}
                  aria-pressed={activeHeroLevel === level}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="level-goal" aria-live="polite">
              {heroGoal}
            </span>
          </div>
        </div>
        <div className="hero-visual" role="img" aria-label={a.heroVisual}>
          <div className="hero-visual-wash"></div>
          <div className="visual-label">
            <i></i> {h.visualLabel}
          </div>
          <div className="learning-window">
            <div className="learning-window-top">
              <span>{h.classroom}</span>
              <span className="window-dots">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
            <div className="learning-window-content">
              <span className="window-kicker">{h.sessionKicker}</span>
              <strong className="floating-confidence">
                <Lines lines={h.confidence} />
              </strong>
              <div className="avatar-row">
                <span>AM</span>
                <span>SK</span>
                <span>+4</span>
                <small>{h.groupMeta}</small>
              </div>
            </div>
          </div>
          <div className="visual-caption">
            <span>{h.caption1}</span>
            <span>{h.caption2}</span>
          </div>
          <div className="reserved-badge">
            <span className="reserved-orbit">{h.reservedValue}</span>
            <span>
              {h.reservedLabel[0]}
              <br />
              <strong>{h.reservedLabel[1]}</strong>
            </span>
          </div>
          <span className="hero-spark" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>

      <section className="benefit-strip section-shell reveal-on-scroll">
        {t.benefits.map((benefit, index) => (
          <article className="benefit-card" key={benefit.title}>
            <span className="benefit-icon" aria-hidden="true">
              {["◉", "✦", "◷"][index]}
            </span>
            <div>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </div>
          </article>
        ))}
      </section>

      <PackageConfigurator />

      <section className="obstacle-section section-shell" id="methode">
        <div className="obstacle-visual">
          <div className="obstacle-halo"></div>
          <div className="dashboard-card">
            <div className="dashboard-head">
              <span>{t.obstacle.dashboardHead}</span>
              <span className="dashboard-menu">•••</span>
            </div>
            <div className="dashboard-body">
              <span className="dashboard-label">{t.obstacle.dashboardLabel}</span>
              <strong>
                <Lines lines={t.obstacle.dashboardTitle} />
              </strong>
              <div className="progress-track">
                <i></i>
              </div>
              <div className="dashboard-footer">
                <span>
                  <b>12</b>
                  <small>{t.obstacle.sessionsDone}</small>
                </span>
                <span className="dashboard-sticker">
                  <Lines lines={t.obstacle.sticker} />
                </span>
              </div>
            </div>
          </div>
          <span className="path-line" aria-hidden="true"></span>
          <span className="obstacle-star" aria-hidden="true">
            ✳
          </span>
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
          <div className="mid-levels">
            {levelCodes.map((level) => (
              <span key={level}>{level}</span>
            ))}
          </div>
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
                  alt={a.courseImage(program.title)}
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
                <a className="button button-warm program-cta" href="#contact" aria-label={a.programInfo(program.title)}>
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

      <section className="reviews-section section-shell" id="avis">
        <div className="reviews-heading">
          <p className="section-tag">{t.reviews.tag}</p>
          <h2>
            {t.reviews.title[0]}
            <br />
            <span>{t.reviews.title[1]}</span>
          </h2>
          <p>{t.reviews.intro}</p>
        </div>
        <div className="reviews-content">
          <aside className="google-rating">
            <span className="google-wordmark">
              <b>G</b> Google
            </span>
            <strong>{t.reviews.ratingTitle}</strong>
            <p>{t.reviews.ratingText}</p>
            <span className="google-stars" aria-label={t.reviews.ratingAria}>
              ☆ ☆ ☆ ☆ ☆
            </span>
            <small>{t.reviews.ratingNote}</small>
          </aside>
          <div className="review-grid">
            {t.reviews.cards.map((card, index) => (
              <article className="review-card" key={card.title}>
                <div className="review-card-top">
                  <span className={`review-avatar ${index === 0 ? "avatar-lilac" : "avatar-orange"}`}>N</span>
                  <span className="google-g">G</span>
                </div>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
                <span className="review-placeholder">{t.reviews.placeholder}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="career-section section-shell" id="carrieres">
        <div className="career-banner">
          <div className="career-copy">
            <p className="section-tag">{t.careers.tag}</p>
            <h2>
              <Lines lines={t.careers.title} />
            </h2>
            <p>{t.careers.text}</p>
            <a className="button button-warm" href="#contact" onClick={() => setRequestType("application")}>
              {t.careers.cta} <Arrow />
            </a>
          </div>
          <div className="career-art" aria-hidden="true">
            <span className="career-sun"></span>
            <div className="studio-chair">
              <i></i>
              <b></b>
              <span></span>
            </div>
            <div className="megaphone">
              <i></i>
              <b></b>
            </div>
            <span className="career-spark">✳</span>
            <span className="career-art-label">
              MAKE
              <br />
              SOME
              <br />
              <b>NOISE</b>
            </span>
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
          <form className="inquiry-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="requestType">
              {ct.iWant}
            </label>
            <select id="requestType" name={ct.iWant} value={requestType} onChange={(event) => setRequestType(event.target.value)}>
              <option value="consultation">{ct.options.consultation}</option>
              <option value="course-info">{ct.options.info}</option>
              <option value="application">{ct.options.application}</option>
            </select>
            <div className="form-grid">
              <label>
                <span>{ct.name}</span>
                <input name={ct.name} autoComplete="name" required placeholder={ct.namePh} />
              </label>
              <label>
                <span>{ct.email}</span>
                <input name={ct.email} type="email" autoComplete="email" required placeholder={ct.emailPh} />
              </label>
              <label>
                <span>
                  {ct.phone} <em>{ct.optional}</em>
                </span>
                <input name={ct.phone} type="tel" autoComplete="tel" placeholder={ct.phonePh} />
              </label>
              <label>
                <span>{requestType === "application" ? ct.background : ct.goal}</span>
                <input name={requestType === "application" ? ct.background : ct.goal} required placeholder={requestType === "application" ? ct.backgroundPh : ct.goalPh} />
              </label>
            </div>
            {requestType === "application" && (
              <>
                <label className="field-label application-field" htmlFor="background">
                  {ct.about}
                </label>
                <textarea id="background" name={ct.about} rows={3} placeholder={ct.aboutPh} required />
              </>
            )}
            <label className="consent">
              <input type="checkbox" required />
              <span>{ct.consent}</span>
            </label>
            <button className="button button-primary submit-button" type="submit">
              {ct.submit} <Arrow />
            </button>
            {formMessage && (
              <p className="form-message" role="status">
                {formMessage}
              </p>
            )}
            <p className="form-disclaimer">{ct.disclaimer}</p>
          </form>
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
          <a href="#accueil">{t.footer.top}</a>
        </div>
      </footer>
    </main>
  );
}
