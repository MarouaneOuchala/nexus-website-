"use client";

import { FormEvent, useEffect, useState } from "react";
import PackageConfigurator from "@/components/PackageConfigurator";

const programs = [
  { number: "01", title: "Anglais pour les 10–15 ans", description: "Des activités et des échanges guidés pour apprendre en prenant confiance.", tag: "10–15 ans", image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80" },
  { number: "02", title: "Anglais des affaires", description: "Travaillez les échanges professionnels, les présentations et le vocabulaire de votre secteur.", tag: "Professionnel", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" },
  { number: "03", title: "Préparation au Bac", description: "Révisez les compétences et les formats utiles pour l’épreuve d’anglais du Bac marocain.", tag: "Lycée / Bac", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80" },
  { number: "04", title: "Anglais général", description: "Construisez des bases solides et gagnez en aisance, du niveau débutant à avancé.", tag: "A1 — C1", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=85" },
  { number: "05", title: "Préparation IELTS", description: "Entraînez-vous aux épreuves et recevez des retours ciblés sur vos objectifs.", tag: "Examen", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1000&q=85" },
  { number: "06", title: "Cours individuels", description: "Un accompagnement construit autour de vos priorités et de votre rythme.", tag: "Format VIP", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85" },
];

const faqs = [
  { question: "Comment demander une première consultation ?", answer: "Choisissez « Demande de consultation » dans le formulaire et indiquez vos objectifs. L’équipe NEXUS vous recontactera pour convenir de la suite. Les demandes en ligne ne sont pas encore transmises tant que l’adresse de réception n’est pas configurée." },
  { question: "Les cours sont-ils individuels ou en groupe ?", answer: "Les formats en petit groupe et les cours individuels sont proposés dans le catalogue. La disponibilité et le tarif exact sont à confirmer avec l’équipe selon le programme choisi." },
  { question: "Combien coûte un forfait ?", answer: "Les forfaits en groupe sont à 900 MAD pour 3 mois, 1 500 MAD pour 6 mois (+ 1 mois offert) et 2 600 MAD pour 12 mois (+ 2 mois offerts). Le format VIP individuel ajoute 80 %. Le montant est confirmé avec l’équipe avant toute inscription." },
  { question: "Puis-je changer mon planning ?", answer: "Les modalités de changement et d’annulation n’ont pas encore été définies. Elles seront communiquées avant toute confirmation de cours." },
  { question: "Quels moyens de paiement acceptez-vous ?", answer: "Les moyens de paiement ne sont pas encore confirmés pour NEXUS. Aucun paiement n’est demandé sur ce site." },
];

const heroLevels = [
  { level: "A1", goal: "Se présenter et échanger les premières phrases." },
  { level: "A2", goal: "Gérer les conversations courantes avec plus d’aisance." },
  { level: "B1", goal: "Exprimer ses idées au travail ou en voyage." },
  { level: "B2", goal: "Participer avec assurance aux échanges professionnels." },
  { level: "C1", goal: "Nuancer ses idées dans des contextes exigeants." },
];

export default function Home() {
  const [requestType, setRequestType] = useState("consultation");
  const [formMessage, setFormMessage] = useState("");
  const [programPage, setProgramPage] = useState(0);
  const [activeHeroLevel, setActiveHeroLevel] = useState("A1");

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".benefit-strip, .obstacle-section, .mid-cta, .programs-section, .why-section, .reviews-section, .career-section, .faq-section, .contact-section, .package-section"));
    const revealAll = () => targets.forEach((target) => target.classList.add("is-visible"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    document.documentElement.classList.add("has-scroll-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
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
      setFormMessage("Votre demande n’a pas été envoyée : l’adresse de réception NEXUS n’est pas encore configurée.");
      return;
    }
    const values = new FormData(event.currentTarget);
    const body = Array.from(values.entries()).map(([key, value]) => `${key}: ${value}`).join("\n");
    const subject = requestType === "application" ? "Candidature NEXUS" : "Demande de consultation NEXUS";
    window.location.href = `mailto:${inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setFormMessage("Votre application de messagerie s’ouvre avec votre demande. Envoyez le message pour le transmettre à NEXUS.");
  }

  const programPageCount = Math.ceil(programs.length / 3);

  return (
    <main className="nexus-page">
      <header className="sticky-header">
        <div className="announcement"><span className="announcement-offer"><span aria-hidden="true">⚡</span> Offre exclusive</span><span className="announcement-deal">6 mois <strong>+ 1 gratuit</strong></span><span className="announcement-availability"><i></i> Places réservées à 85%</span></div>
        <div className="site-header">
        <a className="wordmark" href="#accueil" aria-label="NEXUS, accueil"><span className="wordmark-icon" aria-hidden="true">N</span><span>NEXUS<span className="wordmark-period">.</span></span><span className="cap-mark" aria-hidden="true">✦</span></a>
        <nav className="desktop-nav" aria-label="Navigation principale"><a href="#accueil">Accueil</a><a href="#programmes">Nos cours</a><a href="#carrieres">Carrière</a><a href="#faq">FAQs</a><a href="#avis">Archives</a></nav>
        <div className="header-actions"><button className="language-pill" type="button" aria-label="Langue sélectionnée : français"><span aria-hidden="true">◎</span> Français <span aria-hidden="true">⌄</span></button><a className="button button-small button-primary header-cta" href="#contact">Contactez-nous <span aria-hidden="true">↗</span></a></div>
        <details className="mobile-nav"><summary aria-label="Ouvrir le menu"><span></span><span></span></summary><nav aria-label="Navigation mobile"><a href="#accueil">Accueil</a><a href="#programmes">Nos cours</a><a href="#carrieres">Carrière</a><a href="#faq">FAQs</a><a href="#avis">Archives</a><a href="#contact">Contactez-nous</a></nav></details>
        </div>
      </header>

      <section className="hero section-shell" id="accueil">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"></span> COURS D’ANGLAIS EN LIGNE · MAROC</p><h1>L’anglais ouvre<br />de <span>nouveaux horizons.</span></h1><p className="hero-description">Prenez confiance, une conversation à la fois. Des cours en direct pour vos études, votre carrière et les projets qui vous ressemblent.</p>
          <ul className="hero-benefits"><li><span aria-hidden="true">✓</span> Cours en direct avec un enseignant</li><li><span aria-hidden="true">✓</span> Sessions interactives en petit groupe</li><li><span aria-hidden="true">✓</span> Des horaires adaptés à votre rythme</li></ul>
          <div className="hero-actions"><a className="button button-primary" href="#forfaits">Commencez maintenant <span aria-hidden="true">↗</span></a><a className="button button-outline" href="#programmes">Nos programmes</a></div>
          <div className="hero-levels"><span>Votre niveau, votre départ</span><div className="level-track" role="group" aria-label="Choisir un niveau CECRL">{heroLevels.map(({ level }) => <button className={`level-chip ${activeHeroLevel === level ? "is-active" : ""}`} key={level} type="button" onClick={() => setActiveHeroLevel(level)} aria-pressed={activeHeroLevel === level}>{level}</button>)}</div><span className="level-goal" aria-live="polite">{heroLevels.find(({ level }) => level === activeHeroLevel)?.goal}</span></div>
        </div>
        <div className="hero-visual" role="img" aria-label="Des apprenants échangent autour d’un cours d’anglais en ligne"><div className="hero-visual-wash"></div><div className="visual-label"><i></i> ENGLISH, OUT LOUD</div><div className="learning-window"><div className="learning-window-top"><span>NEXUS classroom</span><span className="window-dots"><i></i><i></i><i></i></span></div><div className="learning-window-content"><span className="window-kicker">TODAY’S SESSION</span><strong className="floating-confidence">Speak with<br />confidence.</strong><div className="avatar-row"><span>AM</span><span>SK</span><span>+4</span><small>Live group · 6 learners</small></div></div></div><div className="visual-caption"><span>01 / APPRENDRE ENSEMBLE</span><span>Le progrès commence par une conversation.</span></div><div className="reserved-badge"><span className="reserved-orbit">85%</span><span>Places<br /><strong>réservées</strong></span></div><span className="hero-spark" aria-hidden="true">✳</span></div>
      </section>

      <section className="benefit-strip section-shell reveal-on-scroll" aria-label="Les avantages des cours NEXUS"><article className="benefit-card"><span className="benefit-icon">◉</span><div><h3>En direct, vraiment</h3><p>Échangez et progressez avec un enseignant.</p></div></article><article className="benefit-card"><span className="benefit-icon">✦</span><div><h3>Un cadre certifiant</h3><p>Avancez par niveaux, de A1 à C1.</p></div></article><article className="benefit-card"><span className="benefit-icon">◷</span><div><h3>Un rythme flexible</h3><p>Choisissez un format qui vous convient.</p></div></article></section>

      <PackageConfigurator />

      <section className="obstacle-section section-shell" id="methode"><div className="obstacle-visual"><div className="obstacle-halo"></div><div className="dashboard-card"><div className="dashboard-head"><span>NEXUS · VOTRE PARCOURS</span><span className="dashboard-menu">•••</span></div><div className="dashboard-body"><span className="dashboard-label">PROGRESSION DU MOIS</span><strong>Parler avec<br />plus d’aisance.</strong><div className="progress-track"><i></i></div><div className="dashboard-footer"><span><b>12</b><small>sessions suivies</small></span><span className="dashboard-sticker">KEEP<br />GOING ↗</span></div></div></div><span className="path-line" aria-hidden="true"></span><span className="obstacle-star" aria-hidden="true">✳</span></div><div className="obstacle-copy"><p className="section-tag">Apprenez l’anglais, dès maintenant !</p><h2>Ne laissez plus<br />l’anglais être <span>un obstacle.</span></h2><p className="section-intro">Un accompagnement concret vous aide à avancer pas à pas, sans attendre d’être parfaitement prêt.</p><ul className="check-list"><li><span>✓</span><div><strong>Saisissez de nouvelles opportunités</strong><small>Pour vos études et votre carrière.</small></div></li><li><span>✓</span><div><strong>Voyagez avec plus de confiance</strong><small>Faites de chaque échange une occasion d’apprendre.</small></div></li><li><span>✓</span><div><strong>Préparez vos entretiens sereinement</strong><small>Entraînez-vous à présenter vos idées clairement.</small></div></li></ul><a className="button button-primary" href="#forfaits">Commencez maintenant <span aria-hidden="true">↗</span></a></div></section>

      <section className="mid-cta"><div className="mid-cta-inner"><span className="mid-cta-tag">Rejoignez nos cours d’anglais interactifs</span><h2>Chaque mot appris<br />vous rapproche de la suite.</h2><a className="button button-warm" href="#programmes">Trouver mon programme <span aria-hidden="true">↗</span></a><div className="mid-levels" aria-label="Niveaux disponibles">{["A1", "A2", "B1", "B2", "C1"].map((level) => <span key={level}>{level}</span>)}</div></div><span className="mid-cta-shape mid-cta-shape-one"></span><span className="mid-cta-shape mid-cta-shape-two"></span></section>

      <section className="section-shell programs-section" id="programmes"><div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line"></span> NOS PROGRAMMES</p><h2>Un anglais utile.<br /><span>Pour votre prochain chapitre.</span></h2></div><a className="view-all-link" href="#contact">Voir tout <span aria-hidden="true">↗</span></a></div><p className="section-intro programs-intro">Choisissez un objectif. Nous vous aiderons à trouver le format de cours qui lui correspond.</p><div className="program-grid" aria-live="polite">{programs.slice(programPage * 3, programPage * 3 + 3).map((program) => <article className="program-item" key={program.number}><div className="program-photo"><img className="w-full h-full object-cover object-[50%_25%] transition-transform duration-500 hover:scale-105" src={program.image} alt={`Cours ${program.title}`} loading="lazy" /><span>{program.tag}</span></div><div className="program-card-copy"><div className="program-topline"><span>PROGRAMME {program.number}</span><span aria-hidden="true">↗</span></div><h3>{program.title}</h3><p>{program.description}</p><a className="button button-warm program-cta" href="#contact" aria-label={`Demander des informations sur ${program.title}`}>Découvrir le programme <span aria-hidden="true">↗</span></a></div></article>)}</div><div className="carousel-controls"><button type="button" aria-label="Programmes précédents" onClick={() => setProgramPage((current) => Math.max(0, current - 1))} disabled={programPage === 0}>←</button><span>{Array.from({ length: programPageCount }, (_, index) => <button className={programPage === index ? "is-current" : ""} key={index} type="button" aria-label={`Afficher la sélection de programmes ${index + 1}`} aria-current={programPage === index ? "page" : undefined} onClick={() => setProgramPage(index)} />)}</span><button type="button" aria-label="Programmes suivants" onClick={() => setProgramPage((current) => Math.min(programPageCount - 1, current + 1))} disabled={programPage === programPageCount - 1}>→</button></div></section>

      <section className="why-section"><div className="section-shell why-layout"><div className="why-visual" role="img" aria-label="Apprenante souriante pendant un cours d’anglais"><div className="why-photo"></div><span className="why-bubble">Your<br />voice<br /><b>matters.</b></span><span className="why-seal">NEXUS<br /><b>LEARN</b></span></div><div className="why-copy"><p className="section-tag">Pourquoi nous ?</p><h2>Un apprentissage<br />qui vous <span>ressemble.</span></h2><p className="section-intro">Vos objectifs donnent le cap. Nous vous aidons à garder le rythme et à faire de chaque cours un vrai temps de pratique.</p><ul className="check-list why-list"><li><span>✓</span><div><strong>Des enseignants présents</strong><small>Un accompagnement humain pendant les cours.</small></div></li><li><span>✓</span><div><strong>Une pratique active</strong><small>La conversation au cœur de chaque séance.</small></div></li><li><span>✓</span><div><strong>Des objectifs personnalisés</strong><small>Études, carrière ou préparation aux examens.</small></div></li><li><span>✓</span><div><strong>Des formats au choix</strong><small>Petit groupe ou cours particuliers.</small></div></li><li><span>✓</span><div><strong>Un parcours à votre rythme</strong><small>Progressez étape par étape, de A1 à C1.</small></div></li></ul><a className="button button-primary" href="#contact">Parlons de votre objectif <span aria-hidden="true">↗</span></a></div></div></section>

      <section className="reviews-section section-shell" id="avis"><div className="reviews-heading"><p className="section-tag">Avis</p><h2>Les étudiants<br /><span>en parlent.</span></h2><p>Les témoignages vérifiés seront publiés ici dès qu’ils seront disponibles.</p></div><div className="reviews-content"><aside className="google-rating"><span className="google-wordmark"><b>G</b> Google</span><strong>Votre retour compte.</strong><p>Les avis Google NEXUS seront affichés ici après vérification.</p><span className="google-stars" aria-label="Avis non encore disponibles">☆ ☆ ☆ ☆ ☆</span><small>Avis en cours de collecte</small></aside><div className="review-grid"><article className="review-card"><div className="review-card-top"><span className="review-avatar avatar-lilac">N</span><span className="google-g">G</span></div><strong>Votre expérience, bientôt ici</strong><p>Nous donnerons la parole aux apprenants dès que des avis vérifiés seront disponibles.</p><span className="review-placeholder">Témoignage à venir</span></article><article className="review-card"><div className="review-card-top"><span className="review-avatar avatar-orange">N</span><span className="google-g">G</span></div><strong>Un espace pour vos retours</strong><p>Chaque retour aide les futurs apprenants à choisir le parcours qui leur convient.</p><span className="review-placeholder">Témoignage à venir</span></article></div></div></section>

      <section className="career-section section-shell" id="carrieres"><div className="career-banner"><div className="career-copy"><p className="section-tag">Carrières</p><h2>Faites grandir<br />les voix de demain.</h2><p>Vous aimez transmettre et encourager la prise de parole ? Présentez-nous votre parcours pédagogique.</p><a className="button button-warm" href="#contact" onClick={() => setRequestType("application")}>Postulez maintenant <span aria-hidden="true">↗</span></a></div><div className="career-art" aria-hidden="true"><span className="career-sun"></span><div className="studio-chair"><i></i><b></b><span></span></div><div className="megaphone"><i></i><b></b></div><span className="career-spark">✳</span><span className="career-art-label">MAKE<br />SOME<br /><b>NOISE</b></span></div></div></section>

      <section className="faq-section" id="faq"><div className="section-shell faq-layout"><div className="faq-heading"><p className="section-tag">＋ FAQ</p><h2>Les réponses<br />à vos <span>questions.</span></h2><p className="faq-aside">Tout ce qu’il faut savoir avant de commencer votre parcours.</p><a className="text-link" href="#contact">Nous contacter <span aria-hidden="true">↗</span></a></div><div className="faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary><span>{faq.question}</span><span className="faq-toggle" aria-hidden="true"></span></summary><p>{faq.answer}</p></details>)}</div></div></section>

      <section className="contact-section" id="contact"><div className="section-shell contact-layout"><div className="contact-copy"><p className="eyebrow eyebrow-light"><span className="eyebrow-line"></span> FAISONS CONNAISSANCE</p><h2>Votre anglais.<br /><span>Votre prochain pas.</span></h2><p>Parlez-nous de votre objectif. Nous vous aiderons à identifier le programme adapté.</p><div className="contact-aside"><span className="contact-aside-mark">N.</span><span>Une demande ne confirme pas une réservation.</span></div></div><form className="inquiry-form" onSubmit={handleSubmit}><label className="field-label" htmlFor="requestType">Je souhaite</label><select id="requestType" name="Type de demande" value={requestType} onChange={(event) => setRequestType(event.target.value)}><option value="consultation">Demander une consultation</option><option value="course-info">Recevoir des informations sur un cours</option><option value="application">Proposer ma candidature comme enseignant</option></select><div className="form-grid"><label><span>Nom complet</span><input name="Nom" autoComplete="name" required placeholder="Votre nom" /></label><label><span>Adresse e-mail</span><input name="E-mail" type="email" autoComplete="email" required placeholder="vous@exemple.ma" /></label><label><span>Téléphone <em>(facultatif)</em></span><input name="Téléphone" type="tel" autoComplete="tel" placeholder="+212 …" /></label><label><span>{requestType === "application" ? "Formation / expérience" : "Votre objectif"}</span><input name="Objectif ou formation" required placeholder={requestType === "application" ? "Votre parcours" : "Études, travail, examen…"} /></label></div>{requestType === "application" && <><label className="field-label application-field" htmlFor="background">Quelques mots sur votre parcours</label><textarea id="background" name="Présentation" rows={3} placeholder="Expérience, disponibilités, motivation…" required /></>}<label className="consent"><input type="checkbox" required /><span>J’accepte que NEXUS utilise ces informations pour répondre à ma demande.</span></label><button className="button button-primary submit-button" type="submit">Envoyer ma demande <span aria-hidden="true">↗</span></button>{formMessage && <p className="form-message" role="status">{formMessage}</p>}<p className="form-disclaimer">Les demandes ne sont pas transmises tant que l’adresse de réception NEXUS n’est pas configurée.</p></form></div></section>

      <footer className="site-footer"><div className="section-shell footer-main"><a className="wordmark footer-wordmark" href="#accueil"><span className="wordmark-icon" aria-hidden="true">N</span><span>NEXUS<span className="wordmark-period">.</span></span></a><p>Ouvrir de nouvelles voies<br />grâce à l’anglais.</p><nav aria-label="Liens de pied de page"><a href="#programmes">Nos cours</a><a href="#forfaits">Forfaits</a><a href="#faq">FAQ</a><a href="#contact">Contact & candidatures</a></nav><span className="footer-location">MAROC · EN LIGNE</span></div><div className="section-shell footer-bottom"><span>© 2026 NEXUS</span><span>Prix indicatifs · Paiement non disponible sur le site</span><a href="#accueil">Retour en haut ↑</a></div></footer>
    </main>
  );
}
