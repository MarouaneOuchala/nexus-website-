"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { getEnquiryClient, type BusinessStats as Stats } from "@/lib/enquiries";
import BusinessTrends from "@/components/BusinessTrends";

export const businessCopy = {
  en: {
    tab: "Business stats", inbox: "Enquiries", title: "Your business at a glance",
    scope: "All-time database snapshot. Client enquiry records, not unique people or website visitors. Teacher applications are excluded from the conversion funnel.",
    leads: "Client enquiries", converted: "Confirmed enquiries", rate: "Enquiry conversion rate",
    open: "Open enquiries", overdue: "Overdue callbacks", value: "Confirmed package value",
    applications: "Teacher applications", missing: "Confirmed without a package",
    definition: "Conversion = currently marked Confirmed ÷ all client enquiries. This is not a visitor-to-customer rate. Changing an enquiry's status changes this snapshot.",
    valueNote: "Package value is not collected revenue. Confirmed enquiries without a selected package are not valued here.",
    refresh: "Refresh stats", loading: "Loading business stats…",
    error: "Business stats could not be loaded. Check the business_stats database migration and your admin access, then retry.",
    updated: "Snapshot taken", funnel: "Client enquiry breakdown",
    new: "New", contacted: "Contacted", callback: "Callback", closed: "Closed",
    other: "Not confirmed", empty: "No client enquiries yet. Graphs will appear as enquiries arrive.",
    share: "Share of client enquiries",
  },
  fr: {
    tab: "Statistiques", inbox: "Demandes", title: "Votre activité en un coup d'œil",
    scope: "Instantané de toute la base. Il s'agit de demandes clients, pas de personnes uniques ni de visiteurs du site. Les candidatures sont exclues du parcours de conversion.",
    leads: "Demandes clients", converted: "Demandes confirmées", rate: "Taux de conversion des demandes",
    open: "Demandes en cours", overdue: "Rappels en retard", value: "Valeur des packs confirmés",
    applications: "Candidatures", missing: "Confirmées sans pack",
    definition: "Conversion = demandes actuellement confirmées ÷ toutes les demandes clients. Ce n'est pas un taux visiteurs/clients. Un changement de statut modifie cet instantané.",
    valueNote: "La valeur des packs n'est pas un revenu encaissé. Les demandes confirmées sans pack sélectionné ne sont pas valorisées ici.",
    refresh: "Actualiser les statistiques", loading: "Chargement des statistiques…",
    error: "Impossible de charger les statistiques. Vérifiez la migration business_stats et votre accès administrateur, puis réessayez.",
    updated: "Instantané du", funnel: "Répartition des demandes clients",
    new: "Nouveau", contacted: "Contacté", callback: "À rappeler", closed: "Clôturé",
    other: "Non confirmées", empty: "Aucune demande client pour le moment. Les graphiques se rempliront avec les demandes.",
    share: "Part des demandes clients",
  },
  ar: {
    tab: "إحصائيات النشاط", inbox: "الطلبات", title: "نشاطك في لمحة",
    scope: "لقطة لجميع سجلات قاعدة البيانات. الأرقام تخص طلبات العملاء وليس أشخاصاً فريدين أو زوار الموقع. طلبات التدريس مستبعدة من مسار التحويل.",
    leads: "طلبات العملاء", converted: "الطلبات المؤكدة", rate: "معدل تحويل الطلبات",
    open: "الطلبات الجارية", overdue: "اتصالات متأخرة", value: "قيمة الباقات المؤكدة",
    applications: "طلبات التدريس", missing: "طلبات مؤكدة دون باقة",
    definition: "التحويل = الطلبات المؤكدة حالياً ÷ جميع طلبات العملاء. هذا ليس معدل تحويل زوار الموقع إلى عملاء. تغيير حالة الطلب يغيّر هذه اللقطة.",
    valueNote: "قيمة الباقات ليست إيرادات محصّلة. الطلبات المؤكدة دون باقة محددة لا تدخل في هذه القيمة.",
    refresh: "تحديث الإحصائيات", loading: "جارٍ تحميل الإحصائيات…",
    error: "تعذر تحميل الإحصائيات. تحقق من ترحيل business_stats وصلاحية المسؤول ثم أعد المحاولة.",
    updated: "وقت اللقطة", funnel: "توزيع طلبات العملاء",
    new: "جديد", contacted: "تم التواصل", callback: "إعادة اتصال", closed: "مغلق",
    other: "غير مؤكدة", empty: "لا توجد طلبات عملاء بعد. ستظهر البيانات في الرسوم مع وصول الطلبات.",
    share: "حصة طلبات العملاء",
  },
} as const;

export default function BusinessStats() {
  const { lang } = useSettings();
  const copy = businessCopy[lang];
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setBusy(true);
      setFailed(false);
      try {
        const { data, error } = await getEnquiryClient().rpc("business_stats", {}).single();
        if (error || !data) throw error ?? new Error("NO_STATS");
        if (active) setStats(data);
      } catch (error) {
        console.error("NEXUS: Business stats failed.", error instanceof Error ? error.message : "Database request failed");
        if (active) { setFailed(true); setStats(null); }
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [revision]);
  const number = (value: number) => value.toLocaleString(lang);
  const ratio = (count: number) => stats?.client_enquiries ? count / stats.client_enquiries : 0;
  const percent = (value: number) => new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }).format(value);
  const conversion = stats ? ratio(stats.converted) : 0;
  const cards = stats ? [
    [copy.leads, number(stats.client_enquiries)],
    [copy.converted, number(stats.converted)],
    [copy.rate, percent(conversion)],
    [copy.open, number(stats.open_enquiries)],
    [copy.overdue, number(stats.overdue_callbacks)],
    [copy.value, `${number(stats.confirmed_value_mad)} MAD`],
    [copy.missing, number(stats.confirmed_without_package)],
    [copy.applications, number(stats.applications)],
  ] : [];
  const funnel = stats ? [
    [copy.new, stats.new_enquiries], [copy.contacted, stats.contacted],
    [copy.callback, stats.callbacks], [copy.converted, stats.converted], [copy.closed, stats.closed],
  ] as const : [];
  return <section className="business-stats" aria-labelledby="business-title" aria-busy={busy}>
    <div className="business-heading"><h2 id="business-title">{copy.title}</h2>
      <button disabled={busy} onClick={() => setRevision((value) => value + 1)}>{copy.refresh}</button></div>
    <p>{copy.scope}</p>
    {busy && <p role="status">{copy.loading}</p>}
    {failed && <p className="enquiry-error" role="alert">{copy.error}</p>}
    {stats && !busy && <>
      <p className="business-timestamp">{copy.updated}: <time dateTime={stats.measured_at}>{new Date(stats.measured_at).toLocaleString(lang)}</time></p>
      <dl className="business-cards">{cards.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      {!stats.client_enquiries && <p role="status">{copy.empty}</p>}
      <div className="business-charts">
        <figure className="business-chart" aria-labelledby="conversion-chart-title">
          <figcaption id="conversion-chart-title">{copy.rate}</figcaption>
          <div className="business-donut">
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <circle className="business-donut-track" cx="100" cy="100" r="80" />
              <circle className="business-donut-value" cx="100" cy="100" r="80" pathLength="100"
                strokeDasharray={`${conversion * 100} 100`} transform="rotate(-90 100 100)" />
            </svg>
            <strong>{percent(conversion)}</strong>
          </div>
          <ul className="business-chart-legend">
            <li><span><i className="business-key-confirmed" aria-hidden="true" />{copy.converted}</span><strong>{number(stats.converted)}</strong></li>
            <li><span><i className="business-key-other" aria-hidden="true" />{copy.other}</span><strong>{number(stats.client_enquiries - stats.converted)}</strong></li>
          </ul>
        </figure>
        <figure className="business-chart" aria-labelledby="status-chart-title">
          <figcaption id="status-chart-title">{copy.funnel}</figcaption>
          <p className="business-chart-unit">{copy.share}</p>
          <ul className="business-breakdown">{funnel.map(([label, count]) => <li key={label}>
            <span>{label}</span><strong>{number(count)} <small>({percent(ratio(count))})</small></strong>
            <span className="business-bar" aria-hidden="true"><span style={{ width: `${ratio(count) * 100}%` }} /></span>
          </li>)}</ul>
          <div className="business-chart-axis" aria-hidden="true"><span>{percent(0)}</span><span>{percent(.5)}</span><span>{percent(1)}</span></div>
        </figure>
      </div>
      <p>{copy.definition}</p><p>{copy.valueNote}</p>
    </>}
    <BusinessTrends />
  </section>;
}
