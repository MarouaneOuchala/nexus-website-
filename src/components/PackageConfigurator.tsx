"use client";

import { useState, type CSSProperties } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { DEFAULT_SESSIONS, MAX_SESSIONS, MIN_SESSIONS, SESSION_BUNDLES, SESSION_STEP, getRegularTotal, getTotal } from "@/lib/pricing";

// Arabic uses comma grouping here because "2.699" would read as a decimal.
const locales = { en: "en-US", fr: "fr-FR", ar: "en-US" } as const;

export default function PackageConfigurator() {
  const { t, lang } = useSettings();
  const c = t.calculator;
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);

  const locale = locales[lang];
  const total = getTotal(sessions);
  const totalText = new Intl.NumberFormat(locale).format(total);
  const regularTotalText = new Intl.NumberFormat(locale).format(getRegularTotal(sessions));
  const fill = `${((sessions - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS)) * 100}%`;

  const message = c.whatsappMessage(sessions, totalText);
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <section className="package-section" id="forfaits" aria-labelledby="package-title">
      <div className="package-shell">
        <div className="package-heading">
          <p className="package-eyebrow">{c.eyebrow}</p>
          <h2 id="package-title">
            {c.title}
            <span>.</span>
          </h2>
          <p>{c.intro}</p>
        </div>

        <div className="calc-card">
          <div className="calc-panel">
            <div className="calc-slider-head">
              <label htmlFor="sessions-range">{c.sliderLabel}</label>
              <output htmlFor="sessions-range" className="calc-slider-value">
                {sessions}
              </output>
            </div>
            <input
              id="sessions-range"
              className="calc-range"
              type="range"
              min={MIN_SESSIONS}
              max={MAX_SESSIONS}
              step={SESSION_STEP}
              value={sessions}
              onChange={(event) => setSessions(Number(event.target.value))}
              aria-valuetext={`${sessions} ${c.unit(sessions)}`}
              style={{ "--fill": fill } as CSSProperties}
            />
            <div className="calc-scale" aria-hidden="true">
              {SESSION_BUNDLES.map((bundle, index) => (
                <span className={`calc-scale-mark calc-scale-mark-${index + 1}`} key={bundle}>
                  {bundle}
                </span>
              ))}
            </div>

            <p className="calc-label">{c.includesTitle}</p>
            <ul className="calc-includes">
              {c.includes.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <aside className="calc-summary">
            <p className="summary-kicker">{c.summaryKicker}</p>
            <p className="calc-total-label">{c.totalLabel}</p>
            <p className="calc-original-price">
              <span className="sr-only">{c.regularPriceLabel}: </span>
              <del>{regularTotalText} {c.currency}</del>
            </p>
            <p className="calc-total" key={total}>
              {totalText} <span>{c.currency}</span>
            </p>
            <dl className="calc-meta">
              <div>
                <dt>{c.sessionsLabel}</dt>
                <dd>
                  {sessions} {c.unit(sessions)}
                </dd>
              </div>
            </dl>
            <a className="button button-warm calc-cta" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              {c.cta} <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <p className="summary-disclaimer">{c.note}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
