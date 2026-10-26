"use client";

import { useState, type CSSProperties } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { useEnquiry } from "@/components/EnquiryProvider";
import { enquiryCopy } from "@/lib/enquiries";
import { DEFAULT_SESSIONS, MAX_SESSIONS, MIN_SESSIONS, SESSION_BUNDLES, SESSION_STEP, getRegularTotal, getTotal } from "@/lib/pricing";

// Arabic uses comma grouping here because "2.699" would read as a decimal.
const locales = { en: "en-US", fr: "fr-FR", ar: "en-US" } as const;

export default function PackageConfigurator() {
  const { t, lang } = useSettings();
  const openEnquiry = useEnquiry();
  const c = t.calculator;
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);

  const locale = locales[lang];
  const total = getTotal(sessions);
  const totalText = new Intl.NumberFormat(locale).format(total);
  const regularTotalText = new Intl.NumberFormat(locale).format(getRegularTotal(sessions));
  const fill = `${((sessions - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS)) * 100}%`;

  return (
    <section className="package-section" id="forfaits" aria-labelledby="package-title">
      <div className="package-shell">
        <div className="package-heading">
          <p className="package-eyebrow">{c.eyebrow}</p>
          <h2 id="package-title">
            {c.title}
            <span>.</span>
          </h2>
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
            <div className="calc-price-display" aria-live="polite" aria-atomic="true">
              <p className="calc-total" key={total}>
                {totalText} <span>{c.currency}</span>
              </p>
            </div>
            <button className="button button-warm calc-cta" type="button" onClick={() => openEnquiry({ type: "course-info", sessions })}>
              {enquiryCopy[lang].open} <span className="arrow" aria-hidden="true">↗</span>
            </button>
            <p className="summary-disclaimer">{enquiryCopy[lang].disclaimer}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
