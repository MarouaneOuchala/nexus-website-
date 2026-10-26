"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { getEnquiryClient, type BusinessTrends as Trends, type TrendBucket } from "@/lib/enquiries";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedMetric from "@/components/AnimatedMetric";

const copy = {
  en: {
    title: "Visits & conversion trends", start: "From", end: "Through", group: "Group by",
    hour: "Hour of day", day: "Day", month: "Month", metric: "Graph",
    visits: "Consented visits", enquiries: "Client enquiries", converted: "Confirmed enquiry cohort",
    confirmations: "First confirmations", leadRate: "Enquiry conversion rate", visitRate: "Tracked visit conversion rate",
    apply: "Update trends", loading: "Loading trends…", error: "Trends could not be loaded. Check the analytics migration and your admin access, then retry.",
    invalid: "Choose a valid date range of at most 366 days.", details: "View graph data",
    note: "Africa/Casablanca time. Hourly view combines the same hour across the selected dates. Date ranges are inclusive. Daily and monthly views use calendar dates.",
    privacy: "Visits count consenting browsers only, not unique people. Refreshes and tabs share a random visit ID; 30 minutes of inactivity starts a new visit. Ad blockers and declined consent cause undercounting.",
    cohort: "Confirmed enquiry cohort: enquiries arriving in this period that are currently Confirmed. First confirmations: the first recorded transition to Confirmed, at the time an admin made it; reopening and reconfirming do not count twice.",
    rates: "Enquiry rate = confirmed enquiry cohort ÷ client enquiries. Visit rate = distinct tracked visits that produced a currently Confirmed enquiry ÷ tracked visits, grouped by visit start time. Multiple enquiries from one visit count once. Unattributed enquiries are excluded from visit conversion.",
    caution: "Recent leads may not have had time to convert. Compare sample sizes before choosing your best time. No denominator is shown as “—”, not 0%.",
    started: "Visit and first-confirmation tracking began", legacy: "Currently confirmed enquiries without a recorded confirmation time",
    noHistory: "Earlier visits and confirmation times cannot be reconstructed.",
    monthPicker: "Choose month", yearPicker: "Choose year", attributed: "Enquiries linked to a tracked visit",
    totalVisits: "Visits starting in this range", empty: "No positive values for this metric in this selection. See the table for counts and unavailable rates.",
    explore: "Touch a point or use the left and right arrow keys to explore the graph.",
  },
  fr: {
    title: "Tendances des visites et conversions", start: "Du", end: "Au", group: "Regrouper par",
    hour: "Heure de la journée", day: "Jour", month: "Mois", metric: "Graphique",
    visits: "Visites consenties", enquiries: "Demandes clients", converted: "Cohorte de demandes confirmées",
    confirmations: "Premières confirmations", leadRate: "Taux de conversion des demandes", visitRate: "Taux de conversion des visites suivies",
    apply: "Actualiser les tendances", loading: "Chargement des tendances…", error: "Impossible de charger les tendances. Vérifiez la migration et votre accès administrateur, puis réessayez.",
    invalid: "Choisissez une période valide de 366 jours maximum.", details: "Voir les données du graphique",
    note: "Heure Africa/Casablanca. La vue horaire cumule chaque heure sur les dates choisies. Les deux dates sont incluses. Les vues quotidiennes et mensuelles suivent le calendrier.",
    privacy: "Seules les visites consenties sont comptées, pas des personnes uniques. Les onglets et rechargements partagent un identifiant aléatoire ; 30 minutes d'inactivité démarrent une nouvelle visite. Refus et bloqueurs entraînent un sous-comptage.",
    cohort: "Cohorte confirmée : demandes reçues pendant la période et actuellement confirmées. Premières confirmations : premier passage enregistré au statut Confirmé, à l'heure de l'action de l'admin ; une reconfirmation n'est pas recomptée.",
    rates: "Taux demandes = cohorte confirmée ÷ demandes clients. Taux visites = visites suivies distinctes ayant produit une demande actuellement confirmée ÷ visites suivies, selon le début de visite. Une visite ne compte qu'une fois. Les demandes non attribuées sont exclues du taux visites.",
    caution: "Les demandes récentes n'ont peut-être pas encore eu le temps de convertir. Comparez les effectifs. Sans dénominateur, le taux est « — », pas 0 %.",
    started: "Début du suivi des visites et premières confirmations", legacy: "Demandes actuellement confirmées sans heure de confirmation enregistrée",
    noHistory: "Les anciennes visites et heures de confirmation ne peuvent pas être reconstituées.",
    monthPicker: "Choisir un mois", yearPicker: "Choisir une année", attributed: "Demandes liées à une visite suivie",
    totalVisits: "Visites commencées sur cette période", empty: "Aucune valeur positive pour cet indicateur. Consultez les effectifs et taux indisponibles dans le tableau.",
    explore: "Touchez un point ou utilisez les flèches gauche et droite pour explorer le graphique.",
  },
  ar: {
    title: "اتجاهات الزيارات والتحويلات", start: "من", end: "إلى", group: "التجميع حسب",
    hour: "ساعة اليوم", day: "اليوم", month: "الشهر", metric: "الرسم",
    visits: "زيارات بموافقة", enquiries: "طلبات العملاء", converted: "مجموعة الطلبات المؤكدة",
    confirmations: "التأكيدات الأولى", leadRate: "معدل تحويل الطلبات", visitRate: "معدل تحويل الزيارات المتتبعة",
    apply: "تحديث الاتجاهات", loading: "جارٍ تحميل الاتجاهات…", error: "تعذر تحميل الاتجاهات. تحقق من الترحيل وصلاحية المسؤول ثم أعد المحاولة.",
    invalid: "اختر فترة صالحة لا تتجاوز 366 يوماً.", details: "عرض بيانات الرسم",
    note: "التوقيت Africa/Casablanca. تجمع الساعات نفس الساعة عبر الأيام المختارة. تاريخا البداية والنهاية مشمولان. تستخدم الأيام والأشهر التقويم المحلي.",
    privacy: "نحسب زيارات المتصفحات الموافقة فقط وليس أشخاصاً فريدين. تتشارك علامات التبويب وإعادة التحميل معرفاً عشوائياً، وتبدأ زيارة جديدة بعد 30 دقيقة من عدم النشاط. الرفض وأدوات الحجب يقللان الأعداد.",
    cohort: "مجموعة الطلبات المؤكدة: الطلبات الواردة خلال الفترة وحالتها الحالية مؤكدة. التأكيدات الأولى: أول انتقال مسجل إلى مؤكد في وقت إجراء المسؤول. لا تتكرر عند إعادة التأكيد.",
    rates: "معدل الطلبات = مجموعة الطلبات المؤكدة ÷ طلبات العملاء. معدل الزيارات = الزيارات المميزة المتتبعة التي أنتجت طلباً مؤكداً حالياً ÷ الزيارات المتتبعة، حسب بداية الزيارة. الزيارة تحسب مرة واحدة وتستبعد الطلبات غير المرتبطة من معدل الزيارات.",
    caution: "قد تحتاج الطلبات الحديثة وقتاً للتحويل. قارن أحجام العينات. دون مقام يظهر «—» بدلاً من صفر بالمئة.",
    started: "بدأ تتبع الزيارات والتأكيدات الأولى", legacy: "طلبات مؤكدة حالياً دون وقت تأكيد مسجل",
    noHistory: "لا يمكن استعادة الزيارات وأوقات التأكيد السابقة.",
    monthPicker: "اختيار الشهر", yearPicker: "اختيار السنة", attributed: "طلبات مرتبطة بزيارة متتبعة",
    totalVisits: "زيارات بدأت خلال الفترة", empty: "لا توجد قيم موجبة لهذا المؤشر. يعرض الجدول الأعداد والمعدلات غير المتاحة.",
    explore: "المس نقطة أو استخدم سهمي اليمين واليسار لاستكشاف الرسم.",
  },
};
type Metric = "visits" | "enquiries" | "converted" | "confirmations" | "leadRate" | "visitRate";
const metrics: Metric[] = ["visits", "enquiries", "converted", "confirmations", "leadRate", "visitRate"];
type Group = "hour" | "day" | "month";
function moroccoToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function valueFor(bucket: TrendBucket, metric: Metric): number | null {
  if (metric === "leadRate") return bucket.enquiries ? bucket.converted / bucket.enquiries * 100 : null;
  if (metric === "visitRate") return bucket.visits ? bucket.converted_visits / bucket.visits * 100 : null;
  return bucket[metric];
}

export default function BusinessTrends() {
  const { lang } = useSettings();
  const t = copy[lang];
  const reducedMotion = useReducedMotion();
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [start, setStart] = useState(() => `${moroccoToday().slice(0, 7)}-01`);
  const [end, setEnd] = useState(moroccoToday);
  const [group, setGroup] = useState<Group>("day");
  const [metric, setMetric] = useState<Metric>("visits");
  const [selection, setSelection] = useState({ start, end, group, revision: 0 });
  const [data, setData] = useState<Trends | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<"error" | "invalid" | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      setBusy(true); setError(null);
      try {
        const { data, error } = await getEnquiryClient().rpc("business_trends", {
          start_date: selection.start, end_date: selection.end, granularity: selection.group,
        });
        if (error || !data) throw error ?? new Error("NO_TRENDS");
        if (active) setData(data);
      } catch (error) {
        console.error("NEXUS: Trends failed.", error instanceof Error ? error.message : "Database request failed");
        if (active) { setError("error"); setData(null); }
      } finally { if (active) setBusy(false); }
    }
    void load();
    return () => { active = false; };
  }, [selection]);
  function apply(event: FormEvent) {
    event.preventDefault();
    const days = (Date.parse(end) - Date.parse(start)) / 86400000;
    if (!Number.isFinite(days) || days < 0 || days > 365) { setError("invalid"); return; }
    setSelection({ start, end, group, revision: selection.revision + 1 });
  }
  function chooseMonth(value: string) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    setStart(`${value}-01`);
    const [year, month] = value.split("-").map(Number);
    setEnd(new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10));
    setGroup("day");
  }
  function chooseYear(value: string) {
    if (!/^\d{4}$/.test(value) || Number(value) < 2000 || Number(value) > 2100) return;
    setStart(`${value}-01-01`); setEnd(`${value}-12-31`); setGroup("month");
  }
  const rate = metric === "leadRate" || metric === "visitRate";
  const format = (value: number | null, metricToFormat: Metric = metric) => value === null ? "—" : metricToFormat === "leadRate" || metricToFormat === "visitRate"
    ? new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }).format(value / 100) : value.toLocaleString(lang);
  const buckets = data?.buckets ?? [];
  const values = buckets.map(b => valueFor(b, metric));
  const activeIndex = Math.max(0, buckets.findIndex(bucket => bucket.key === activeBucket));
  const highlighted = buckets[activeIndex];
  const max = rate ? 100 : Math.max(2, Math.ceil(Math.max(0, ...values.map(v => v ?? 0)) / 2) * 2);
  const width = Math.max(640, buckets.length * 24);
  const x = (index: number) => 55 + index * (width - 85) / Math.max(1, buckets.length - 1);
  const y = (value: number) => 210 - value / max * 170;
  const path = values.map((v, i) => v === null ? "" : `${i === 0 || values[i - 1] === null ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const totals = buckets.reduce((a, b) => ({
    visits: a.visits + b.visits, enquiries: a.enquiries + b.enquiries,
    attributed: a.attributed + b.attributed, converted_visits: a.converted_visits + b.converted_visits,
  }), { visits: 0, enquiries: 0, attributed: 0, converted_visits: 0 });
  return <section className="business-trends" aria-labelledby="trends-title">
    <h3 id="trends-title">{t.title}</h3><p>{t.note}</p>
    <form className="trend-controls" onSubmit={apply}>
      <label>{t.start}<input type="date" required value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>{t.end}<input type="date" required value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label>{t.group}<select value={group} onChange={e => { const v = e.target.value; if (v === "hour" || v === "day" || v === "month") setGroup(v); }}>
        {(["hour", "day", "month"] as const).map(g => <option key={g} value={g}>{t[g]}</option>)}
      </select></label>
      <label>{t.monthPicker}<input type="month" onChange={e => chooseMonth(e.target.value)} /></label>
      <label>{t.yearPicker}<input type="number" min="2000" max="2100" placeholder="2026" onChange={e => chooseYear(e.target.value)} /></label>
      <button className="admin-refresh" disabled={busy} aria-busy={busy}><span aria-hidden="true">↻</span>{t.apply}</button>
    </form>
    {busy && <p className="admin-loading" role="status"><span className="admin-loading-dot" aria-hidden="true" />{t.loading}</p>}
    {error && <p className="enquiry-error" role="alert">{t[error]}</p>}
    {data && !busy && !error && <>
      <p>{t.started}: <time dateTime={data.tracking_started_at}>{new Date(data.tracking_started_at).toLocaleString(lang, { timeZone: "Africa/Casablanca" })}</time>. {t.noHistory}</p>
      <p>{t.legacy}: {data.legacy_confirmed.toLocaleString(lang)}</p>
      <dl className="business-cards trend-summary">
        <div><dt>{t.totalVisits}</dt><dd><AnimatedMetric value={totals.visits} lang={lang} /></dd></div>
        <div><dt>{t.attributed}</dt><dd>{totals.attributed.toLocaleString(lang)} / {totals.enquiries.toLocaleString(lang)}</dd></div>
        <div><dt>{t.visitRate}</dt><dd>{totals.visits ? <AnimatedMetric value={totals.converted_visits / totals.visits} lang={lang} percent /> : "—"}</dd></div>
      </dl>
      <label className="trend-metric">{t.metric}<select value={metric} onChange={e => { const v = metrics.find(m => m === e.target.value); if (v) setMetric(v); }}>
        {metrics.map(m => <option key={m} value={m}>{t[m]}</option>)}
      </select></label>
      <figure className="business-chart trend-figure" aria-labelledby="trend-chart-title">
        <figcaption id="trend-chart-title">{t[metric]} · {selection.start} — {selection.end} · {t[selection.group]}</figcaption>
        {!values.some(v => v !== null && v > 0) && <p>{t.empty}</p>}
        <p id="trend-explore-hint" className="trend-explore-hint">{t.explore}</p>
        {highlighted && <div className="trend-readout" role="status" aria-atomic="true"><span>{highlighted.key}</span><strong>{format(valueFor(highlighted, metric))}</strong><span>{t[metric]}</span></div>}
        <div className="trend-scroll" dir="ltr" tabIndex={0} aria-label={t[metric]} aria-describedby="trend-explore-hint"
          onKeyDown={event => {
            if (!buckets.length || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const index = event.key === "Home" ? 0 : event.key === "End" ? buckets.length - 1
              : Math.max(0, Math.min(buckets.length - 1, activeIndex + (event.key === "ArrowRight" ? 1 : -1)));
            setActiveBucket(buckets[index].key);
            event.currentTarget.scrollTo({ left: Math.max(0, x(index) - event.currentTarget.clientWidth / 2), behavior: "instant" });
          }}>
          <svg viewBox={`0 0 ${width} 265`} style={{ minWidth: width }} role="img" aria-labelledby="trend-svg-title">
            <title id="trend-svg-title">{t[metric]} — {t.details}</title>
            {[0, .5, 1].map(tick => <g key={tick}><line x1="55" x2={width - 30} y1={y(max * tick)} y2={y(max * tick)} className="trend-grid" />
              <text x="48" y={y(max * tick) + 5} textAnchor="end">{format(max * tick)}</text></g>)}
            <motion.path key={`${metric}-${selection.revision}`} d={path} className="trend-line"
              initial={{ pathLength: reducedMotion ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducedMotion ? 0 : .7 }} />
            {highlighted && <line x1={x(activeIndex)} x2={x(activeIndex)} y1="30" y2="210" className="trend-crosshair" />}
            {values.map((v, i) => v !== null && <g key={buckets[i].key} onPointerEnter={() => setActiveBucket(buckets[i].key)}
              onClick={() => setActiveBucket(buckets[i].key)}>
              <circle cx={x(i)} cy={y(v)} r="12" fill="transparent" />
              <circle cx={x(i)} cy={y(v)} r={i === activeIndex ? 6 : 4} className="trend-point"><title>{buckets[i].key}: {format(v)}</title></circle>
            </g>)}
            {buckets.map((b, i) => (i % Math.max(1, Math.ceil(buckets.length / 12)) === 0 || i === buckets.length - 1) && <text key={b.key} x={x(i)} y="240" textAnchor="middle">{selection.group === "day" ? b.key.slice(5) : b.key}</text>)}
          </svg>
        </div>
      </figure>
      <details className="trend-data"><summary>{t.details}</summary><div className="trend-scroll">
        <table><caption>{t.title} · {selection.start} — {selection.end}</caption><thead><tr><th>{t[selection.group]}</th>{metrics.map(m => <th key={m}>{t[m]}</th>)}</tr></thead>
          <tbody>{buckets.map(b => <tr key={b.key}><th scope="row">{b.key}</th>{metrics.map(m => <td key={m}>{format(valueFor(b, m), m)}</td>)}</tr>)}</tbody>
        </table>
      </div></details>
    </>}
    <p>{t.privacy}</p><p>{t.cohort}</p><p>{t.rates}</p><p>{t.caution}</p>
  </section>;
}
