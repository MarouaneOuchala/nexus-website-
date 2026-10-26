"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { enquiryCopy, getEnquiryClient, schedulePreferences, type Teacher, type TeacherWorkload } from "@/lib/enquiries";
import { teacherCopy } from "@/lib/teacher-copy";
import { useSettings } from "@/components/SettingsProvider";

type DraftState = { dirty: boolean; saving: boolean };
type ProfileFields = Pick<Teacher, "schedule_preference" | "availability_notes" | "notes" | "teaching_languages" | "specialties" | "client_capacity">;
const fieldsFor = (teacher: Teacher): ProfileFields => ({
  schedule_preference: teacher.schedule_preference, availability_notes: teacher.availability_notes,
  notes: teacher.notes, teaching_languages: teacher.teaching_languages, specialties: teacher.specialties,
  client_capacity: teacher.client_capacity,
});

function TeacherProfile({ teacher, onSaved, onDraftChange }: {
  teacher: Teacher; onSaved: (teacher: Teacher) => void; onDraftChange: (state: DraftState) => void;
}) {
  const { lang } = useSettings();
  const t = teacherCopy[lang];
  const [fields, setFields] = useState(() => fieldsFor(teacher));
  const [baseline, setBaseline] = useState(teacher);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"saved" | "failed" | "">("");
  const inFlight = useRef(false);
  const dirty = JSON.stringify(fields) !== JSON.stringify(fieldsFor(baseline));
  useEffect(() => {
    onDraftChange({ dirty, saving: busy });
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    if (dirty || busy) window.addEventListener("beforeunload", warn);
    return () => { onDraftChange({ dirty: false, saving: false }); window.removeEventListener("beforeunload", warn); };
  }, [dirty, busy, onDraftChange]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setResult("");
    try {
      const { data, error } = await getEnquiryClient().from("teachers").update(fields)
        .eq("id", teacher.id).eq("updated_at", baseline.updated_at).select().single();
      if (error || !data) throw new Error(error?.code ?? "NO_TEACHER");
      onSaved(data);
      setBaseline(data);
      setResult("saved");
    } catch (error) {
      console.error("NEXUS: Teacher profile save failed.", error instanceof Error ? error.message : "Unknown error");
      setResult("failed");
    } finally { inFlight.current = false; setBusy(false); }
  }
  return <form className="teacher-profile-form" onSubmit={save} aria-label={`${t.profile}: ${teacher.name}`} aria-busy={busy}
    onKeyDown={event => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!busy) event.currentTarget.requestSubmit(); }
    }}>
    <fieldset disabled={busy}>
      <label>{t.schedule}<select value={fields.schedule_preference} onChange={event => {
        const schedule = schedulePreferences.find(value => value === event.target.value);
        if (schedule) setFields(previous => ({ ...previous, schedule_preference: schedule }));
      }}>{schedulePreferences.map(value => <option key={value} value={value}>{t.schedules[value]}</option>)}</select></label>
      <label>{t.availability}<textarea rows={3} maxLength={1000} value={fields.availability_notes} onChange={event => setFields(previous => ({ ...previous, availability_notes: event.target.value }))} /><small>{t.availabilityHint}</small></label>
      <label>{t.languages}<input maxLength={200} value={fields.teaching_languages} onChange={event => setFields(previous => ({ ...previous, teaching_languages: event.target.value }))} /></label>
      <label>{t.specialties}<input maxLength={500} value={fields.specialties} onChange={event => setFields(previous => ({ ...previous, specialties: event.target.value }))} /></label>
      <label>{t.capacity}<input type="number" min={1} max={200} step={1} value={fields.client_capacity ?? ""} onChange={event => {
        const capacity = event.target.value === "" ? null : event.target.valueAsNumber;
        setFields(previous => ({ ...previous, client_capacity: capacity }));
      }} /><small>{t.capacityHint}</small></label>
      <label>{t.notes}<textarea rows={4} maxLength={3000} value={fields.notes} onChange={event => setFields(previous => ({ ...previous, notes: event.target.value }))} /></label>
      {dirty && <p className="admin-draft-badge">{enquiryCopy[lang].unsaved}</p>}
      <button type="submit">{busy ? t.saving : t.save}</button>
    </fieldset>
    {result && <p role={result === "failed" ? "alert" : "status"} className={result === "failed" ? "enquiry-error" : undefined}>{t[result]}</p>}
  </form>;
}

export default function TeacherDirectory({ teachers, onChange, revision, onDraftChange }: {
  teachers: Teacher[] | null; onChange: Dispatch<SetStateAction<Teacher[] | null>>; revision: number;
  onDraftChange: (state: DraftState) => void;
}) {
  const { lang } = useSettings();
  const t = teacherCopy[lang];
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [countsFailed, setCountsFailed] = useState(false);
  const [counts, setCounts] = useState<TeacherWorkload[] | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const profileDraft = useRef<DraftState>({ dirty: false, saving: false });
  const trackDraft = useCallback((state: DraftState) => { profileDraft.current = state; onDraftChange(state); }, [onDraftChange]);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const countGeneration = useRef(0);
  const loadCounts = useCallback(async () => {
    const generation = ++countGeneration.current;
    try {
      const { data, error } = await getEnquiryClient().rpc("teacher_workload", {});
      if (error || !data) throw new Error(error?.code ?? "NO_WORKLOAD");
      if (mounted.current && generation === countGeneration.current) { setCounts(data); setCountsFailed(false); }
    } catch (error) {
      console.error("NEXUS: Teacher workload loading failed.", error instanceof Error ? error.message : "Unknown error");
      if (mounted.current && generation === countGeneration.current) { setCounts(null); setCountsFailed(true); }
    }
  }, []);
  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setFailed(false);
    try {
      const { data, error } = await getEnquiryClient().from("teachers").select().order("created_at");
      if (error || !data) throw new Error(error?.code ?? "NO_TEACHERS");
      if (mounted.current) onChange(data);
      await loadCounts();
    } catch (error) {
      console.error("NEXUS: Teacher loading failed.", error instanceof Error ? error.message : "Unknown error");
      if (mounted.current) setFailed(true);
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }, [onChange, loadCounts]);
  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => { if (mounted.current) void load(); });
    return () => { mounted.current = false; };
  }, [load]);
  useEffect(() => {
    let active = true;
    if (revision > 0) queueMicrotask(() => { if (active && mounted.current) void loadCounts(); });
    return () => { active = false; };
  }, [revision, loadCounts]);

  function canSwitch() {
    if (profileDraft.current.saving) { window.alert(t.wait); return false; }
    return !profileDraft.current.dirty || window.confirm(t.discard);
  }
  async function change(teacher?: Teacher) {
    if (inFlight.current) return;
    if (profileDraft.current.saving) { window.alert(t.wait); return; }
    if (teacher && ((selected === teacher.id && !canSwitch()) || !window.confirm(t.archive))) return;
    if (!teacher && (name.trim().length < 2 || name.trim().length > 80)) { setFailed(true); return; }
    inFlight.current = true; setBusy(true); setFailed(false);
    try {
      const query = getEnquiryClient().from("teachers");
      const { data, error } = teacher
        ? await query.update({ active: false }).eq("id", teacher.id).eq("updated_at", teacher.updated_at).select().single()
        : await query.insert({ name: name.trim() }).select().single();
      if (error || !data) throw new Error(error?.code ?? "NO_TEACHER");
      if (mounted.current) {
        onChange(previous => teacher ? (previous ?? []).map(row => row.id === data.id ? data : row) : [...(previous ?? []), data]);
        if (!teacher) setName("");
        else if (selected === teacher.id) setSelected(null);
        await loadCounts();
      }
    } catch (error) {
      console.error("NEXUS: Teacher update failed.", error instanceof Error ? error.message : "Unknown error");
      if (mounted.current) setFailed(true);
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  const visible = teachers?.filter(row => row.active || showRemoved) ?? [];
  return <details className="admin-teachers" open={failed || countsFailed ? true : undefined} aria-busy={busy}>
    <summary>{t.title} · {teachers?.filter(row => row.active).length ?? "—"}</summary>
    <p>{t.private}</p><p className="teacher-count-scope">{t.scope}</p>
    <div className="teacher-directory-tools">
      <button type="button" disabled={busy} onClick={() => { if (canSwitch()) { setSelected(null); void load(); } }}>{t.reload}</button>
      <label className="teacher-removed-toggle"><input type="checkbox" checked={showRemoved} onChange={event => {
        const hidesEditor = !event.target.checked && teachers?.find(row => row.id === selected)?.active === false;
        if (!hidesEditor || canSwitch()) { setShowRemoved(event.target.checked); if (hidesEditor) setSelected(null); }
      }} />{t.showRemoved}</label>
    </div>
    <form className="teacher-add-form" onSubmit={event => { event.preventDefault(); void change(); }}>
      <label>{t.name}<input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} disabled={busy || teachers === null} /></label>
      <button type="submit" disabled={busy || teachers === null}>{busy ? t.saving : t.add}</button>
    </form>
    {(failed || countsFailed) && <p className="enquiry-error" role="alert">{t.failed}</p>}
    {teachers && !visible.length && <p role="status">{t.empty}</p>}
    <div className="teacher-card-grid">{visible.map(teacher => {
      const count = counts?.find(row => row.teacher_id === teacher.id);
      const full = count && teacher.client_capacity !== null && count.active_clients >= teacher.client_capacity;
      return <article className="teacher-card" key={teacher.id} data-capacity={full ? "full" : undefined}>
        <header><h3 dir="auto">{teacher.name}</h3>{!teacher.active && <span>{t.removed}</span>}</header>
        {count ? <>
          <dl className="teacher-metrics">{([
            [t.total, count.total_clients], [t.active, count.active_clients], [t.assigned, count.assigned_clients],
            [t.paused, count.paused_clients], [t.pending, count.pending_clients], [t.finished, count.finished_clients],
          ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString(lang)}</dd></div>)}</dl>
          <p className="teacher-capacity">{teacher.client_capacity === null ? t.noCapacity : full ? t.atCapacity
            : `${t.remaining}: ${Math.max(0, teacher.client_capacity - count.active_clients).toLocaleString(lang)}`} {teacher.client_capacity !== null && `(${count.active_clients.toLocaleString(lang)} / ${teacher.client_capacity.toLocaleString(lang)})`}</p>
          <p className="teacher-measured">{t.updated}: <time dateTime={count.measured_at}>{new Date(count.measured_at).toLocaleString(lang)}</time></p>
        </> : <p role="status">{t.unavailable}</p>}
        <dl className="teacher-profile-summary">
          <div><dt>{t.schedule}</dt><dd>{t.schedules[teacher.schedule_preference]}</dd></div>
          {([[t.availability, teacher.availability_notes], [t.languages, teacher.teaching_languages], [t.specialties, teacher.specialties], [t.notes, teacher.notes]] as const)
            .filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}
        </dl>
        <div className="teacher-card-actions"><button type="button" disabled={busy} aria-expanded={selected === teacher.id} onClick={() => {
          if (canSwitch()) setSelected(selected === teacher.id ? null : teacher.id);
        }}>{selected === teacher.id ? t.close : t.edit}</button>
          {teacher.active && <button type="button" disabled={busy} onClick={() => void change(teacher)}>{t.remove}</button>}</div>
        {selected === teacher.id && <TeacherProfile teacher={teacher} onDraftChange={trackDraft}
          onSaved={updated => onChange(previous => (previous ?? []).map(row => row.id === updated.id ? updated : row))} />}
      </article>;
    })}</div>
  </details>;
}
