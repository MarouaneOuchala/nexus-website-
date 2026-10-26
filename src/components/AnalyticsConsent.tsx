"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { analyticsConsent, recordAnalyticsActivity, setAnalyticsConsent } from "@/lib/analytics";

const copy = {
  en: {
    title: "Help us understand what works",
    text: "Allow visit measurement using a random ID on this device? Tracking starts only after consent. No names, emails, full URLs or advertising IDs are sent with visit events. If you enquire, we link that request to the visit to measure conversion. A new visit starts after 30 minutes of inactivity. Your enquiries work either way.",
    accept: "Allow analytics", decline: "No thanks", settings: "Analytics preferences",
    withdraw: "You can decline at any time to stop future tracking. Earlier aggregate counts remain.",
    error: "Your browser blocked preference storage. Analytics is off. You can still use the website.",
  },
  fr: {
    title: "Aidez-nous à comprendre ce qui fonctionne",
    text: "Autoriser la mesure des visites avec un identifiant aléatoire sur cet appareil ? Le suivi commence après votre accord. Aucun nom, email, URL complète ou identifiant publicitaire n'accompagne les visites. Si vous envoyez une demande, elle est liée à la visite pour mesurer la conversion. Nouvelle visite après 30 minutes d'inactivité. Les demandes fonctionnent dans tous les cas.",
    accept: "Autoriser les statistiques", decline: "Non merci", settings: "Préférences statistiques",
    withdraw: "Vous pouvez refuser à tout moment pour arrêter le suivi futur. Les anciens totaux restent conservés.",
    error: "Votre navigateur bloque le stockage des préférences. Le suivi est désactivé. Le site reste utilisable.",
  },
  ar: {
    title: "ساعدنا على فهم ما ينجح",
    text: "هل تسمح بقياس الزيارات بمعرف عشوائي على هذا الجهاز؟ يبدأ التتبع بعد موافقتك فقط، دون إرسال أسماء أو بريد أو روابط كاملة أو معرفات إعلانية مع أحداث الزيارة. إذا أرسلت طلباً نربطه بالزيارة لقياس التحويل. تبدأ زيارة جديدة بعد 30 دقيقة من عدم النشاط. يمكنك إرسال طلبك في الحالتين.",
    accept: "السماح بالإحصائيات", decline: "لا شكراً", settings: "تفضيلات الإحصائيات",
    withdraw: "يمكنك الرفض في أي وقت لإيقاف التتبع المستقبلي. تبقى الأعداد الإجمالية السابقة محفوظة.",
    error: "المتصفح يمنع حفظ التفضيلات. التتبع متوقف ويمكنك استخدام الموقع.",
  },
};

export default function AnalyticsConsent() {
  const { lang } = useSettings();
  const pathname = usePathname();
  const t = copy[lang];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const admin = pathname.startsWith("/admin");
  useEffect(() => {
    if (admin) return;
    const sync = () => { setOpen(analyticsConsent() === null); void recordAnalyticsActivity(); };
    const activity = () => { void recordAnalyticsActivity(); };
    const storage = (event: StorageEvent) => { if (event.key === "nexus-analytics-consent" || event.key === null) sync(); };
    sync();
    window.addEventListener("nexus-analytics-consent", sync);
    window.addEventListener("storage", storage);
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("scroll", activity, { passive: true });
    document.addEventListener("visibilitychange", activity);
    return () => {
      window.removeEventListener("nexus-analytics-consent", sync);
      window.removeEventListener("storage", storage);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity);
      document.removeEventListener("visibilitychange", activity);
    };
  }, [admin]);
  function choose(value: "accepted" | "declined") {
    try { setAnalyticsConsent(value); setOpen(false); setError(false); }
    catch { setError(true); }
  }
  if (admin) return null;
  return <aside className="analytics-consent" aria-label={t.settings}>
    <button className="analytics-preferences" onClick={() => setOpen(!open)} aria-expanded={open}>{t.settings}</button>
    {open && <div className="analytics-consent-panel">
      <h2>{t.title}</h2><p>{t.text}</p><p>{t.withdraw}</p>
      <div><button onClick={() => choose("declined")}>{t.decline}</button><button onClick={() => choose("accepted")}>{t.accept}</button></div>
      {error && <p role="alert">{t.error}</p>}
    </div>}
  </aside>;
}
