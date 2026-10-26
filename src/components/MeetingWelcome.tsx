"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { enquiryCopy, getEnquiryClient, teachingStatuses, type TeachingStatus, type Enquiry, type Teacher } from "@/lib/enquiries";
import { teacherCopy } from "@/lib/teacher-copy";
import { moroccoMeetingInput, parseMoroccoMeeting, validMeetingUrl, welcomeMessage } from "@/lib/meeting-welcome";
import { useSettings } from "@/components/SettingsProvider";

const copy = {
  en: {
    title: "Session & welcome message", intro: "Agree on a time with the client, then save it here. Create the group yourself and paste the message below. Nothing is booked or sent automatically.",
    teacher: "Assigned teacher", choose: "Choose a teacher", removed: "removed",
    time: "Agreed meeting date & time (Morocco)", zone: "Always Morocco time, even if your device is in another time zone.",
    link: "Meeting link (optional)", linkHint: "Paste an HTTPS link if you have already created the meeting.",
    save: "Save session", saving: "Saving…", saved: "Session saved.",
    saveError: "Session not saved. Your edits are still here. Refresh the enquiries and teachers, review any changes and retry.",
    timeError: "Choose a valid, unambiguous Morocco date and time. Times skipped or repeated during a clock change cannot be used.",
    linkError: "Use a valid HTTPS meeting link without a username or password.",
    teacherError: "Choose an active teacher and enter the agreed meeting time.",
    preview: "Welcome message", language: "Client language", pending: "Save the teacher and agreed time to enable copying. Availability in the enquiry is not a confirmed appointment.",
    copy: "Copy welcome message", copied: "Message copied. Paste it into the group and send it yourself.",
    copyError: "Copy failed. Select the message below and copy it manually.",
  },
  fr: {
    title: "Séance et message d'accueil", intro: "Convenez d'un créneau avec le client, puis enregistrez-le ici. Créez vous-même le groupe et collez le message ci-dessous. Aucune réservation ni aucun envoi automatique.",
    teacher: "Enseignant attribué", choose: "Choisir un enseignant", removed: "retiré",
    time: "Date et heure convenues (heure du Maroc)", zone: "Toujours à l'heure du Maroc, même si votre appareil est dans un autre fuseau horaire.",
    link: "Lien de la réunion (facultatif)", linkHint: "Collez un lien HTTPS si vous avez déjà créé la réunion.",
    save: "Enregistrer la séance", saving: "Enregistrement…", saved: "Séance enregistrée.",
    saveError: "Séance non enregistrée. Vos saisies sont conservées. Actualisez les demandes et les enseignants, vérifiez les changements et réessayez.",
    timeError: "Choisissez une date et une heure valides et non ambiguës au Maroc. Les heures supprimées ou répétées lors d'un changement d'heure ne sont pas acceptées.",
    linkError: "Utilisez un lien HTTPS valide, sans identifiant ni mot de passe.",
    teacherError: "Choisissez un enseignant actif et indiquez le créneau convenu.",
    preview: "Message d'accueil", language: "Langue du client", pending: "Enregistrez l'enseignant et le créneau convenu pour copier le message. Les disponibilités indiquées ne sont pas un rendez-vous confirmé.",
    copy: "Copier le message d'accueil", copied: "Message copié. Collez-le dans le groupe et envoyez-le vous-même.",
    copyError: "Copie impossible. Sélectionnez le message ci-dessous et copiez-le manuellement.",
  },
  ar: {
    title: "الجلسة ورسالة الترحيب", intro: "اتفق مع العميل على موعد ثم احفظه هنا. أنشئ المجموعة بنفسك والصق الرسالة أدناه. لا يتم حجز أي موعد أو إرسال أي رسالة تلقائيًا.",
    teacher: "المدرّس المكلّف", choose: "اختر مدرّسًا", removed: "تمت إزالته",
    time: "تاريخ ووقت اللقاء المتفق عليهما (بتوقيت المغرب)", zone: "دائمًا بتوقيت المغرب، حتى لو كان جهازك في منطقة زمنية أخرى.",
    link: "رابط اللقاء (اختياري)", linkHint: "ألصق رابط HTTPS إذا كنت قد أنشأت اللقاء بالفعل.",
    save: "حفظ الجلسة", saving: "جارٍ الحفظ…", saved: "تم حفظ الجلسة.",
    saveError: "لم تُحفظ الجلسة. بقيت تعديلاتك. حدّث الطلبات والمدرّسين وراجع التغييرات ثم أعد المحاولة.",
    timeError: "اختر تاريخًا ووقتًا صالحين وغير ملتبسين بتوقيت المغرب. لا يمكن استخدام الأوقات المحذوفة أو المكررة عند تغيير الساعة.",
    linkError: "استخدم رابط HTTPS صالحًا دون اسم مستخدم أو كلمة مرور.",
    teacherError: "اختر مدرّسًا نشطًا وأدخل الموعد المتفق عليه.",
    preview: "رسالة الترحيب", language: "لغة العميل", pending: "احفظ المدرّس والموعد المتفق عليه لنسخ الرسالة. أوقات التفرّغ المذكورة في الطلب ليست موعدًا مؤكدًا.",
    copy: "نسخ رسالة الترحيب", copied: "تم نسخ الرسالة. ألصقها في المجموعة وأرسلها بنفسك.",
    copyError: "تعذر النسخ. حدّد الرسالة أدناه وانسخها يدويًا.",
  },
};

export default function MeetingWelcome({ enquiry, teachers, onSaved, onDraftChange }: {
  enquiry: Enquiry; teachers: Teacher[] | null; onSaved: (row: Enquiry) => void;
  onDraftChange: (state: { dirty: boolean; saving: boolean }) => void;
}) {
  const { lang } = useSettings();
  const t = copy[lang];
  const [teacherId, setTeacherId] = useState(enquiry.teacher_id ?? "");
  const [time, setTime] = useState(moroccoMeetingInput(enquiry.meeting_at));
  const [link, setLink] = useState(enquiry.meeting_url ?? "");
  const [activity, setActivity] = useState<TeachingStatus>(enquiry.teaching_status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const inFlight = useRef(false);
  const teacher = teachers?.find(row => row.id === enquiry.teacher_id);
  const message = enquiry.meeting_at && teacher ? welcomeMessage({
    language: enquiry.language, client: enquiry.full_name, teacher: teacher.name,
    meetingAt: enquiry.meeting_at, meetingUrl: enquiry.meeting_url, diagnostic: enquiry.request_type === "consultation",
  }) : "";
  const unchanged = teacherId === (enquiry.teacher_id ?? "") && time === moroccoMeetingInput(enquiry.meeting_at) && link.trim() === (enquiry.meeting_url ?? "") && activity === enquiry.teaching_status;
  useEffect(() => {
    onDraftChange({ dirty: !unchanged, saving: busy });
    return () => onDraftChange({ dirty: false, saving: false });
  }, [unchanged, busy, onDraftChange]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    setError("");
    setFeedback("");
    if (!teachers?.some(row => row.id === teacherId && (row.active || row.id === enquiry.teacher_id)) || !time) { setError(t.teacherError); return; }
    let meetingAt: string;
    try { meetingAt = parseMoroccoMeeting(time); }
    catch { setError(t.timeError); return; }
    if (!validMeetingUrl(link.trim())) { setError(t.linkError); return; }
    inFlight.current = true;
    setBusy(true);
    try {
      const { data, error: failure } = await getEnquiryClient().from("enquiries").update({
        teacher_id: teacherId, meeting_at: meetingAt, meeting_url: link.trim(), teaching_status: activity,
      }).eq("id", enquiry.id).eq("updated_at", enquiry.updated_at).select().single();
      if (failure || !data) throw new Error(failure?.code ?? "NO_ROW");
      onSaved(data);
      setFeedback(t.saved);
    } catch (failure) {
      console.error("NEXUS: Session save failed.", failure instanceof Error ? failure.message : "Unknown error");
      setError(t.saveError);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function copyMessage() {
    setError("");
    setFeedback("");
    try {
      await navigator.clipboard.writeText(message);
      setFeedback(t.copied);
    } catch (failure) {
      console.error("NEXUS: Welcome message copy failed.", failure instanceof Error ? failure.message : "Clipboard unavailable");
      setError(t.copyError);
    }
  }

  return <section className="admin-meeting" aria-labelledby="meeting-welcome-title">
    <h3 id="meeting-welcome-title">{t.title}</h3><p>{t.intro}</p>
    <form onSubmit={save} aria-busy={busy} onKeyDown={event => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!busy) event.currentTarget.requestSubmit(); }
    }}>
      <fieldset disabled={busy || teachers === null}>
        <label>{t.teacher}<select value={teacherId} required onChange={event => { setTeacherId(event.target.value); setActivity("pending"); setFeedback(""); }}>
          <option value="">{t.choose}</option>
          {teachers?.filter(row => row.active || row.id === teacherId).map(row => <option key={row.id} value={row.id} disabled={!row.active}>{row.name}{!row.active ? ` (${t.removed})` : ""}</option>)}
        </select></label>
        <label>{teacherCopy[lang].activity}<select className="teaching-activity" value={activity} disabled={teacherId !== enquiry.teacher_id} onChange={event => {
          const value = teachingStatuses.find(value => value === event.target.value);
          if (value) { setActivity(value); setFeedback(""); }
        }}>{teachingStatuses.map(value => <option key={value} value={value}>{teacherCopy[lang].stages[value]}</option>)}</select><small>{teacherCopy[lang].activityHint}</small></label>
        <label>{t.time}<input type="datetime-local" value={time} min="2000-01-01T00:00" max="2100-12-31T23:59" required onChange={event => { setTime(event.target.value); setFeedback(""); }} /><small>{t.zone}</small></label>
        <label>{t.link}<input type="url" inputMode="url" maxLength={2000} value={link} onChange={event => { setLink(event.target.value); setFeedback(""); }} /><small>{t.linkHint}</small></label>
        <button type="submit">{busy ? t.saving : t.save}</button>
      </fieldset>
    </form>
    <p className="admin-shortcut">{enquiryCopy[lang].saveShortcut}</p>
    <p className="meeting-language">{t.language}: {enquiry.language.toUpperCase()}</p>
    {(!message || !unchanged) && <p>{t.pending}</p>}
    {message && <label>{t.preview}<textarea className="meeting-message" readOnly value={message} rows={12} lang={enquiry.language} dir={enquiry.language === "ar" ? "rtl" : "ltr"} /></label>}
    <button type="button" disabled={busy || !message || !unchanged} onClick={() => void copyMessage()}>{t.copy}</button>
    {error && <p className="enquiry-error" role="alert">{error}</p>}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
