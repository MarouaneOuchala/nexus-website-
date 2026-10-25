"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { enquiryCopy, enquiryStatuses, getEnquiryClient, type Enquiry, type EnquiryStatus } from "@/lib/enquiries";
import { languages, type Lang } from "@/lib/i18n";

const PAGE_SIZE = 100;

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function FollowUp({ enquiry, onSaved }: { enquiry: Enquiry; onSaved: (row: Enquiry) => void }) {
  const { lang, t } = useSettings();
  const copy = enquiryCopy[lang];
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [notes, setNotes] = useState(enquiry.notes);
  const [nextCall, setNextCall] = useState(localDateTime(enquiry.next_call_at));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const { data, error: failure } = await getEnquiryClient().from("enquiries").update({
        status, notes, next_call_at: nextCall ? new Date(nextCall).toISOString() : null,
      }).eq("id", enquiry.id).eq("updated_at", enquiry.updated_at).select().single();
      if (failure || !data) {
        console.error("NEXUS: Follow-up save failed.", { code: failure?.code ?? "NO_ROW" });
        setError(copy.saveError);
      } else {
        onSaved(data);
        setMessage(copy.saved);
      }
    } catch (failure) {
      console.error("NEXUS: Follow-up save failed.", failure instanceof Error ? failure.message : "Unknown error");
      setError(copy.saveError);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  const details = [
    [copy.received, new Date(enquiry.created_at).toLocaleString(lang)],
    [t.contact.iWant, enquiry.request_type === "application" ? t.contact.options.application : enquiry.request_type === "course-info" ? t.contact.options.info : t.contact.options.consultation],
    [t.contact.name, enquiry.full_name],
    [t.contact.email, enquiry.email],
    [t.contact.phone, enquiry.phone],
    [t.contact.goal, enquiry.goal],
    [t.contact.about, enquiry.background || "—"],
    [copy.preferred, enquiry.preferred_time || "—"],
    [copy.package, enquiry.sessions ? `${enquiry.sessions} ${copy.sessions} · ${enquiry.total_mad?.toLocaleString(lang)} MAD` : copy.noPackage],
    [copy.language, enquiry.language.toUpperCase()],
    [copy.consent, `${enquiry.consent ? copy.yes : "—"} · ${enquiry.consent_version}`],
    [copy.reference, enquiry.id],
  ];
  return (
    <article className="admin-detail">
      <p className="enquiry-kicker">{copy.details}</p>
      <h2>{enquiry.full_name}</h2>
      <div className="admin-actions">
        <a className="button button-primary" href={`tel:+${enquiry.phone}`}>{t.contact.phone} ↗</a>
        <a className="button button-outline" href={`mailto:${enquiry.email}`}>{t.contact.email} ↗</a>
      </div>
      <dl className="admin-fields">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>
      <form className="admin-follow-up" onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy}>
          <label>{copy.status}<select value={status} onChange={(event) => {
            const value = event.target.value;
            if (enquiryStatuses.some((item) => item === value)) setStatus(value as EnquiryStatus);
          }}>{enquiryStatuses.map((item) => <option key={item} value={item}>{copy.statuses[item]}</option>)}</select></label>
          <label>{copy.nextCall}<input type="datetime-local" value={nextCall} onChange={(event) => setNextCall(event.target.value)} /></label>
          <label>{copy.notes}<textarea rows={5} maxLength={10000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="button button-primary" type="submit">{busy ? copy.saving : copy.save}</button>
        </fieldset>
        {error && <p className="enquiry-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
      </form>
    </article>
  );
}

export default function AdminDashboard() {
  const { lang, setLang, t, theme, toggleTheme } = useSettings();
  const copy = enquiryCopy[lang];
  const [access, setAccess] = useState<"loading" | "login" | "admin">("loading");
  const [error, setError] = useState<"loadError" | "forbidden" | "unavailable" | "loginError" | "logoutError" | "">("");
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const verifiedUser = useRef<string | null>(null);

  const load = useCallback(async (offset = 0) => {
    const attempt = generation.current;
    setBusy(true);
    setError("");
    try {
      const { data, error: failure } = await getEnquiryClient().from("enquiries").select()
        .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
      if (attempt !== generation.current) return;
      if (failure || !data) {
        console.error("NEXUS: Enquiry loading failed.", { code: failure?.code ?? "NO_DATA" });
        setError("loadError");
      } else {
        setRows((previous) => offset ? [...previous, ...data.filter((row) => !previous.some((item) => item.id === row.id))] : data);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (failure) {
      console.error("NEXUS: Enquiry loading failed.", failure instanceof Error ? failure.message : "Unknown error");
      if (attempt === generation.current) setError("loadError");
    } finally {
      if (attempt === generation.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const client = getEnquiryClient();
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!active || event === "TOKEN_REFRESHED") return;
        if (event === "SIGNED_IN" && session?.user.id === verifiedUser.current) return;
        const attempt = ++generation.current;
        setRows([]);
        setSelected(null);
        setBusy(false);
        if (!session) { verifiedUser.current = null; setAccess("login"); return; }
        setAccess("loading");
        // Defer the query outside the auth callback to avoid holding the auth lock.
        window.setTimeout(() => {
          void client.rpc("is_admin", {}).then(({ data, error: failure }) => {
            if (!active || attempt !== generation.current) return;
            if (failure || !data) {
              console.error("NEXUS: Admin access denied.", { code: failure?.code ?? "NOT_ADMIN" });
              verifiedUser.current = null;
              setError("forbidden");
              setAccess("login");
            } else {
              setError("");
              verifiedUser.current = session.user.id;
              setAccess("admin");
              void load();
            }
          });
        }, 0);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch (failure) {
      console.error("NEXUS: Admin backend unavailable.", failure instanceof Error ? failure.message : "Unknown error");
      queueMicrotask(() => { if (active) { setError("unavailable"); setAccess("login"); } });
      return () => { active = false; };
    }
  }, [load]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await getEnquiryClient().auth.signInWithPassword({
        email: String(data.get("email")).trim(), password: String(data.get("password")),
      });
      if (failure) {
        console.error("NEXUS: Admin sign-in failed.", { code: failure.code });
        setError("loginError");
      }
    } catch (failure) {
      console.error("NEXUS: Admin sign-in unavailable.", failure instanceof Error ? failure.message : "Unknown error");
      setError(failure instanceof Error && failure.message === "SUPABASE_NOT_CONFIGURED" ? "unavailable" : "loginError");
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  async function logout() {
    setError("");
    try {
      const { error: failure } = await getEnquiryClient().auth.signOut();
      if (failure) throw failure;
      generation.current++;
      setRows([]);
      setSelected(null);
      setAccess("login");
    } catch (failure) {
      console.error("NEXUS: Sign-out failed.", failure instanceof Error ? failure.message : "Unknown error");
      setError("logoutError");
    }
  }

  const query = search.toLocaleLowerCase();
  const filtered = rows.filter((row) => (status === "all" || row.status === status) &&
    [row.full_name, row.email, row.phone, row.goal].some((value) => value.toLocaleLowerCase().includes(query)));
  const current = rows.find((row) => row.id === selected);
  return (
    <main className="nexus-page admin-page">
      <header className="admin-header">
        <Link className="wordmark" href="/">NEXUS.</Link>
        <span>{copy.admin}</span>
        <div className="admin-controls">
          <select aria-label={t.a11y.language} value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
            {languages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
          <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? t.a11y.switchToLight : t.a11y.switchToDark}>{theme === "dark" ? "☀" : "☾"}</button>
          {access === "admin" && <button type="button" onClick={() => void logout()}>{copy.signOut}</button>}
        </div>
      </header>
      <div className="admin-shell">
        <p className="enquiry-kicker">NEXUS / PRIVATE</p>
        <h1>{access === "admin" ? copy.admin : copy.login}</h1>
        <p>{copy.access}</p>
        {error && <p className="enquiry-error" role="alert">{copy[error]}</p>}
        {access === "loading" && <p role="status">{copy.loading}</p>}
        {access === "login" && (
          <form className="admin-login" onSubmit={login}>
            <label>{t.contact.email}<input name="email" type="email" autoComplete="username" required /></label>
            <label>{copy.password}<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button button-primary" disabled={busy}>{busy ? copy.loading : copy.signIn}</button>
            <Link href="/">{copy.back}</Link>
          </form>
        )}
        {access === "admin" && (
          <>
            <div className="admin-stats">
              <div><strong>{rows.length}</strong><span>{copy.total}</span></div>
              {enquiryStatuses.map((item) => <button key={item} onClick={() => setStatus(item)} aria-pressed={status === item}><strong>{rows.filter((row) => row.status === item).length}</strong><span>{copy.statuses[item]}</span></button>)}
            </div>
            <div className="admin-toolbar">
              <input type="search" aria-label={copy.search} placeholder={copy.search} value={search} onChange={(event) => setSearch(event.target.value)} />
              <select aria-label={copy.status} value={status} onChange={(event) => {
                const value = event.target.value;
                if (value === "all" || enquiryStatuses.some((item) => item === value)) setStatus(value as EnquiryStatus | "all");
              }}><option value="all">{copy.all}</option>{enquiryStatuses.map((item) => <option key={item} value={item}>{copy.statuses[item]}</option>)}</select>
              <button disabled={busy} onClick={() => void load()}>{busy ? copy.loading : copy.refresh}</button>
            </div>
            <div className="admin-workspace">
              <section className="admin-list" aria-label={copy.admin}>
                {!filtered.length && <p>{busy ? copy.loading : copy.empty}</p>}
                {filtered.map((row) => <button key={row.id} className="admin-lead" aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}>
                  <span className={`admin-status status-${row.status}`}>{copy.statuses[row.status]}</span>
                  <strong>{row.full_name}</strong><span dir="auto">{row.phone} · {row.email}</span>
                  <span>{row.goal}</span><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString(lang)}</time>
                  {row.next_call_at && <span>{copy.statuses.callback}: {new Date(row.next_call_at).toLocaleString(lang)}</span>}
                </button>)}
                {hasMore && <button disabled={busy} onClick={() => void load(rows.length)}>{copy.more}</button>}
              </section>
              {current ? <FollowUp key={current.id} enquiry={current} onSaved={(updated) => setRows((previous) => previous.map((row) => row.id === updated.id ? updated : row))} /> : <div className="admin-detail"><p>{copy.select}</p></div>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
