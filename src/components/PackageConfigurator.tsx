"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from "react";

type DurationOption = {
  months: 3 | 6 | 12;
  bonusMonths: number;
  price: number;
  badge?: string;
};

type SessionType = "group" | "vip";
type EnglishLevel = "beginner" | "intermediate" | "advanced";

const durationOptions: DurationOption[] = [
  { months: 3, bonusMonths: 0, price: 900 },
  { months: 6, bonusMonths: 1, price: 1500, badge: "Le plus populaire" },
  { months: 12, bonusMonths: 2, price: 2600, badge: "Meilleure valeur" },
];

const levels: { id: EnglishLevel; title: string; subtitle: string }[] = [
  { id: "beginner", title: "Débutant", subtitle: "Beginner" },
  { id: "intermediate", title: "Intermédiaire", subtitle: "Intermediate" },
  { id: "advanced", title: "Avancé", subtitle: "Advanced" },
];

const steps = ["Durée", "Sessions", "Résumé"];
const groupMonthlyRate = 300;

export default function PackageConfigurator() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [duration, setDuration] = useState<DurationOption>(durationOptions[0]);
  const [sessionType, setSessionType] = useState<SessionType>("group");
  const [level, setLevel] = useState<EnglishLevel>("beginner");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const inquiryEmail = process.env.NEXT_PUBLIC_NEXUS_INQUIRY_EMAIL;

  function changeStep(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
    setStatusMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = {
      fullName: fullName.trim() ? "" : "Indiquez votre nom complet.",
      phone: phone.replace(/\D/g, "").length >= 8 ? "" : "Saisissez un numéro valide.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Saisissez une adresse e-mail valide.",
      consent: consent ? "" : "Votre accord est nécessaire pour transmettre la demande.",
    };
    setShowErrors(true);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    if (!inquiryEmail) {
      setStatusMessage("Votre demande n’a pas été envoyée : l’adresse de réception NEXUS n’est pas encore configurée.");
      return;
    }

    const selectedLevel = levels.find((option) => option.id === level)?.title ?? "Débutant";
  const packageTotal = Math.round(duration.price * (sessionType === "vip" ? 1.8 : 1));
  const packagePrice = `${packageTotal.toLocaleString("fr-FR")} MAD`;
    const packageDetails = [
      `Nom : ${fullName}`,
      `Téléphone : +212 ${phone}`,
      `E-mail : ${email}`,
      `Durée : ${duration.months} mois${duration.bonusMonths ? ` + ${duration.bonusMonths} offert(s)` : ""}`,
      `Format : ${sessionType === "group" ? "2 sessions par semaine, petit groupe" : "Cours particuliers VIP"}`,
      `Niveau : ${selectedLevel}`,
      `Estimation : ${packagePrice}`,
      `Prix mensuel moyen : ${Math.floor(packageTotal / (duration.months + duration.bonusMonths)).toLocaleString("fr-FR")} MAD`,
    ].join("\n");

    const subject = encodeURIComponent("Demande de consultation NEXUS");
    const body = encodeURIComponent(packageDetails);
    window.location.href = `mailto:${inquiryEmail}?subject=${subject}&body=${body}`;
    setStatusMessage("Votre application de messagerie s’ouvre avec votre demande. Envoyez le message pour le transmettre à NEXUS.");
  }

  const totalPrice = Math.round(duration.price * (sessionType === "vip" ? 1.8 : 1));
  const includedMonths = duration.months + duration.bonusMonths;
  const monthlyPrice = Math.floor(totalPrice / includedMonths);
  const savingsPercent = Math.round((1 - duration.price / (groupMonthlyRate * includedMonths)) * 100);
  const formattedPrice = totalPrice.toLocaleString("fr-FR");

  const slideVariants = {
    enter: (slideDirection: number) => ({
      opacity: prefersReducedMotion ? 1 : 0,
      x: prefersReducedMotion ? 0 : slideDirection * 32,
      height: prefersReducedMotion ? "auto" : 0,
    }),
    center: { opacity: 1, x: 0, height: "auto" },
    exit: (slideDirection: number) => ({
      opacity: prefersReducedMotion ? 1 : 0,
      x: prefersReducedMotion ? 0 : slideDirection * -32,
      height: prefersReducedMotion ? "auto" : 0,
    }),
  };

  return (
    <section className="package-section" id="forfaits" aria-labelledby="package-title">
      <div className="package-shell">
        <div className="package-heading">
          <p className="package-eyebrow">UN PARCOURS À VOTRE MESURE</p>
          <h2 id="package-title">Composez votre forfait<span>.</span></h2>
          <p>Choisissez votre rythme, puis partagez vos coordonnées pour demander une consultation.</p>
        </div>

        <ol className={`package-progress progress-step-${step}`} aria-label={`Étape ${step} sur 3`}>
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < step;
            const isCurrent = stepNumber === step;
            return (
              <li className={`progress-item ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`} key={label}>
                <span className="progress-circle" aria-current={isCurrent ? "step" : undefined}>{isComplete ? "✓" : stepNumber}</span>
                <span className="progress-label">{label}</span>
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            className="package-step"
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.32, ease: "easeOut" }}
          >
            {step === 1 && (
              <div className="config-step-panel">
                <div className="package-column duration-panel">
                  <fieldset className="package-fieldset">
                    <legend>Durée du forfait</legend>
                    <div className="duration-grid">
                      {durationOptions.map((option) => (
                        <button
                          className={`package-choice duration-choice ${duration.months === option.months ? "is-selected" : ""}`}
                          key={option.months}
                          type="button"
                          onClick={() => setDuration(option)}
                          aria-pressed={duration.months === option.months}
                        >
                          {option.badge && <span className="popular-badge">{option.badge}</span>}
                          <span className="choice-main">x{option.months} mois</span>
                          <span className="choice-detail">{option.bonusMonths ? `+ ${option.bonusMonths} mois offert${option.bonusMonths > 1 ? "s" : ""}` : "Forfait flexible"}</span>
                          <span className="choice-price">{option.price.toLocaleString("fr-FR")} MAD</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <p className="package-estimate-note">Tarifs du cours en groupe. Le format VIP ajoute 80 % au forfait sélectionné.</p>
                  <div className="step-footer duration-footer"><span className="step-hint">Vous pourrez changer votre durée à tout moment.</span><button className="package-button package-button-orange" type="button" onClick={() => changeStep(2)}>Choisir les sessions <span aria-hidden="true">→</span></button></div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="config-step-panel">
                <div className="package-column sessions-panel">
                  <fieldset className="package-fieldset">
                    <legend>Sessions par semaine</legend>
                    <div className="session-grid">
                      <button className={`package-choice session-choice ${sessionType === "group" ? "is-selected" : ""}`} type="button" onClick={() => setSessionType("group")} aria-pressed={sessionType === "group"}>
                        <span className="popular-badge">Le plus populaire</span>
                        <span className="choice-icon" aria-hidden="true">◷</span><span className="choice-main">Cours en groupe</span><span className="choice-detail">2 sessions / semaine · 4–6 personnes</span>
                      </button>
                      <button className={`package-choice session-choice ${sessionType === "vip" ? "is-selected" : ""}`} type="button" onClick={() => setSessionType("vip")} aria-pressed={sessionType === "vip"}>
                        <span className="choice-icon" aria-hidden="true">✦</span><span className="choice-main">Cours particuliers VIP</span><span className="choice-detail">1-on-1 · +80 % par forfait</span>
                      </button>
                    </div>
                  </fieldset>
                  <div className="step-footer"><button className="package-back" type="button" onClick={() => changeStep(1)}><span aria-hidden="true">←</span> Durée</button><button className="package-button package-button-orange" type="button" onClick={() => changeStep(3)}>Voir mon résumé <span aria-hidden="true">→</span></button></div>
                </div>
              </div>
            )}

            {step === 3 && (
              <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
                <aside className="package-summary" aria-label="Résumé du forfait">
                  <p className="summary-kicker">VOTRE SÉLECTION</p>
                  {savingsPercent > 0 && <span className="summary-savings">Économisez {savingsPercent} %</span>}
                  <h3>{sessionType === "group" ? "Cours en groupe" : "Cours particuliers VIP"}</h3>
                  <p className="summary-price">{formattedPrice} <span>MAD</span></p>
                  <p className="summary-duration">{duration.months} mois{duration.bonusMonths ? ` + ${duration.bonusMonths} offert${duration.bonusMonths > 1 ? "s" : ""}` : ""} · {monthlyPrice.toLocaleString("fr-FR")} MAD / mois</p>
                  <ul className="summary-list">
                    <li><span className="summary-icon" aria-hidden="true">✓</span><span>Sessions live chaque semaine</span></li>
                    <li><span className="summary-icon" aria-hidden="true">✓</span><span>Accompagnement tuteur sur WhatsApp</span></li>
                    <li><span className="summary-icon" aria-hidden="true">✓</span><span>Évaluation de niveau CECRL</span></li>
                  </ul>
                  <button className="package-button package-button-orange summary-next" type="submit">Confirmer ma demande <span aria-hidden="true">→</span></button>
                  <p className="summary-disclaimer">Aucun paiement en ligne. Votre demande d’inscription sera confirmée par NEXUS.</p>
                </aside>
                <div className="checkout-details">
                  <div className="step-title-row"><span className="step-kicker">ÉTAPE 03 · RÉSUMÉ</span><h3>Votre parcours, à portée de voix.</h3><p>Vérifiez votre sélection et partagez vos coordonnées pour demander une consultation.</p></div>
                  <fieldset className="package-fieldset checkout-level-fieldset"><legend>Votre niveau actuel</legend><div className="checkout-level-options">{levels.map((option) => <button className={`package-choice ${level === option.id ? "is-selected" : ""}`} key={option.id} type="button" onClick={() => setLevel(option.id)} aria-pressed={level === option.id}>{option.title}</button>)}</div></fieldset>
                  <div className="contact-fields">
                    <label className="config-field"><span>Nom complet</span><input autoComplete="name" name="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Votre nom complet" aria-invalid={showErrors && !fullName.trim()} /><small className="field-error">{showErrors && !fullName.trim() ? "Indiquez votre nom complet." : ""}</small></label>
                    <label className="config-field"><span>Téléphone</span><span className={`phone-input ${showErrors && phone.replace(/\D/g, "").length < 8 ? "has-error" : ""}`}><span aria-hidden="true">+212</span><input autoComplete="tel-national" name="phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="6 00 00 00 00" aria-invalid={showErrors && phone.replace(/\D/g, "").length < 8} /></span><small className="field-error">{showErrors && phone.replace(/\D/g, "").length < 8 ? "Saisissez un numéro valide." : ""}</small></label>
                    <label className="config-field"><span>E-mail</span><input autoComplete="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.ma" aria-invalid={showErrors && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} /><small className="field-error">{showErrors && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Saisissez une adresse e-mail valide." : ""}</small></label>
                  </div>
                  <label className="config-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>J’accepte que NEXUS utilise ces informations pour répondre à ma demande.</span></label>
                  {showErrors && !consent && <small className="field-error consent-error">Votre accord est nécessaire pour transmettre la demande.</small>}
                  <div className="step-footer checkout-footer"><button className="package-back" type="button" onClick={() => changeStep(2)}><span aria-hidden="true">←</span> Sessions</button></div>
                  {statusMessage && <p className="config-status" role="status">{statusMessage}</p>}
                  <p className="config-disclaimer">Les tarifs affichés sont provisoires. Cette demande ne constitue pas une réservation confirmée.</p>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}