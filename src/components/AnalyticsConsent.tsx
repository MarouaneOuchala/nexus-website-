"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSettings } from "@/components/SettingsProvider";
import { analyticsConsent, recordAnalyticsActivity, setAnalyticsConsent } from "@/lib/analytics";

const copy = {
  en: {
    title: "Optional analytics",
    summary: "Allow visit measurement? If you enquire, we link your request to the visit. Declining won't affect your use of the site.",
    details: "How it works",
    text: "Allow visit measurement using a random ID on this device? Tracking starts only after consent. No names, emails, full URLs or advertising IDs are sent with visit events. If you enquire, we link that request to the visit to measure conversion. A new visit starts after 30 minutes of inactivity. Your enquiries work either way.",
    accept: "Allow analytics", decline: "No thanks", settings: "Analytics preferences",
    withdraw: "You can decline at any time to stop future tracking. Earlier aggregate counts remain.",
    error: "Your browser blocked preference storage. Analytics is off. You can still use the website.",
  },
  fr: {
    title: "Statistiques facultatives",
    summary: "Autoriser la mesure des visites ? Toute demande envoyée sera liée à la visite. Refuser ne change rien à votre accès au site.",
    details: "Comment ça marche",
    text: "Autoriser la mesure des visites avec un identifiant aléatoire sur cet appareil ? Le suivi commence après votre accord. Aucun nom, email, URL complète ou identifiant publicitaire n'accompagne les visites. Si vous envoyez une demande, elle est liée à la visite pour mesurer la conversion. Nouvelle visite après 30 minutes d'inactivité. Les demandes fonctionnent dans tous les cas.",
    accept: "Autoriser les statistiques", decline: "Non merci", settings: "Préférences statistiques",
    withdraw: "Vous pouvez refuser à tout moment pour arrêter le suivi futur. Les anciens totaux restent conservés.",
    error: "Votre navigateur bloque le stockage des préférences. Le suivi est désactivé. Le site reste utilisable.",
  },
  ar: {
    title: "إحصائيات اختيارية",
    summary: "هل تسمح بقياس الزيارات؟ إذا أرسلت طلباً نربطه بالزيارة. الرفض لا يؤثر على استخدامك للموقع.",
    details: "كيف يعمل",
    text: "هل تسمح بقياس الزيارات بمعرف عشوائي على هذا الجهاز؟ يبدأ التتبع بعد موافقتك فقط، دون إرسال أسماء أو بريد أو روابط كاملة أو معرفات إعلانية مع أحداث الزيارة. إذا أرسلت طلباً نربطه بالزيارة لقياس التحويل. تبدأ زيارة جديدة بعد 30 دقيقة من عدم النشاط. يمكنك إرسال طلبك في الحالتين.",
    accept: "السماح بالإحصائيات", decline: "لا شكراً", settings: "تفضيلات الإحصائيات",
    withdraw: "يمكنك الرفض في أي وقت لإيقاف التتبع المستقبلي. تبقى الأعداد الإجمالية السابقة محفوظة.",
    error: "المتصفح يمنع حفظ التفضيلات. التتبع متوقف ويمكنك استخدام الموقع.",
  },
};

export function AnalyticsPreferencesButton() {
  const { lang } = useSettings();
  return <button type="button" className="analytics-preferences" aria-controls="analytics-consent-panel"
    onClick={() => window.dispatchEvent(new Event("nexus-open-analytics-preferences"))}>
    {copy[lang].settings}
  </button>;
}

export default function AnalyticsConsent() {
  const { lang } = useSettings();
  const pathname = usePathname();
  const t = copy[lang];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const reducedMotion = useReducedMotion();
  const panel = useRef<HTMLElement>(null);
  const preferencesTrigger = useRef<HTMLElement | null>(null);
  const admin = pathname.startsWith("/admin");
  useEffect(() => {
    if (open && preferencesTrigger.current) panel.current?.querySelector("button")?.focus();
  }, [open]);
  useEffect(() => {
    if (admin) return;
    const sync = () => { setOpen(analyticsConsent() === null); void recordAnalyticsActivity(); };
    const reopen = () => {
      preferencesTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setError(false);
      setOpen(true);
    };
    const activity = () => { void recordAnalyticsActivity(); };
    const storage = (event: StorageEvent) => { if (event.key === "nexus-analytics-consent" || event.key === null) sync(); };
    sync();
    window.addEventListener("nexus-analytics-consent", sync);
    window.addEventListener("nexus-open-analytics-preferences", reopen);
    window.addEventListener("storage", storage);
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("scroll", activity, { passive: true });
    document.addEventListener("visibilitychange", activity);
    return () => {
      window.removeEventListener("nexus-analytics-consent", sync);
      window.removeEventListener("nexus-open-analytics-preferences", reopen);
      window.removeEventListener("storage", storage);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity);
      document.removeEventListener("visibilitychange", activity);
    };
  }, [admin]);
  function choose(value: "accepted" | "declined") {
    try {
      setAnalyticsConsent(value);
      setOpen(false);
      setError(false);
      preferencesTrigger.current?.focus({ preventScroll: true });
      preferencesTrigger.current = null;
    }
    catch { setError(true); }
  }
  if (admin) return null;
  return <AnimatePresence>
    {open && <motion.aside key="analytics-consent" ref={panel} className="analytics-consent analytics-consent-panel"
      id="analytics-consent-panel" aria-label={t.settings}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : 8, pointerEvents: "none" }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}>
      <h2>{t.title}</h2><p>{t.summary}</p>
      <details><summary>{t.details}</summary><p>{t.text}</p><p>{t.withdraw}</p></details>
      <div className="analytics-actions"><button type="button" onClick={() => choose("declined")}>{t.decline}</button><button type="button" onClick={() => choose("accepted")}>{t.accept}</button></div>
      {error && <p role="alert">{t.error}</p>}
    </motion.aside>}
  </AnimatePresence>;
}
