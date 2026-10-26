import type { Lang } from "./i18n";

const moroccoClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const gmtClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const gmtRestoredAt = Date.parse("2026-09-20T01:00:00Z");

function meetingTimeZone(instant: string): string {
  // IANA's 2026 update restores GMT; older Android/WebView tzdata still assumes GMT+1.
  // https://github.com/eggert/tz/blob/main/africa (Decree No. 2.26.530)
  return Date.parse(instant) >= gmtRestoredAt ? "UTC" : "Africa/Casablanca";
}

export function moroccoMeetingInput(instant: string | null): string {
  if (!instant) return "";
  const parts = (meetingTimeZone(instant) === "UTC" ? gmtClock : moroccoClock).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function parseMoroccoMeeting(value: string): string {
  if (!/^(20\d{2}|2100)-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("INVALID_MEETING_TIME");
  const wall = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wall)) throw new Error("INVALID_MEETING_TIME");
  // Probe both sides of Morocco's Ramadan clock changes. Reject skipped or repeated times.
  const matches = new Set<string>();
  for (const hours of [-36, 0, 36]) {
    const probe = wall + hours * 3600000;
    const offset = Date.parse(`${moroccoMeetingInput(new Date(probe).toISOString())}:00Z`) - probe;
    const candidate = new Date(wall - offset).toISOString();
    if (moroccoMeetingInput(candidate) === value) matches.add(candidate);
  }
  if (matches.size !== 1) throw new Error("INVALID_MEETING_TIME");
  return [...matches][0];
}

export function validMeetingUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return value.length <= 2000 && !/\s/.test(value) && url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function welcomeMessage({ language, client, teacher, meetingAt, meetingUrl = "", diagnostic }: {
  language: Lang; client: string; teacher: string; meetingAt: string; meetingUrl?: string; diagnostic: boolean;
}): string {
  const time = new Intl.DateTimeFormat(language, {
    timeZone: meetingTimeZone(meetingAt), dateStyle: "full", timeStyle: "short", hourCycle: "h23",
  }).format(new Date(meetingAt));
  if (language === "fr") return [
    `Bonjour ${client}, bienvenue chez NEXUS Academy !`,
    `Nous sommes ravis de vous accompagner dans votre parcours en anglais. Votre enseignant sera ${teacher}.`,
    `Comme convenu, ${diagnostic ? "votre diagnostic d'anglais gratuit de 20 minutes" : "votre séance d'anglais"} aura lieu le ${time} (heure du Maroc).`,
    ...(meetingUrl ? [`Lien de la réunion : ${meetingUrl}`] : []),
    "Ce groupe nous permettra d'échanger et de préparer votre séance. Vous pouvez y poser vos questions ou nous prévenir si vous devez changer de créneau.",
    "Au plaisir de vous rencontrer !\nL'équipe NEXUS Academy",
  ].join("\n\n");
  if (language === "ar") return [
    `مرحبًا ${client}، أهلًا بك في NEXUS Academy!`,
    `يسعدنا مرافقتك في رحلتك لتعلّم الإنجليزية. سيكون مدرّسك ${teacher}.`,
    `كما اتفقنا، موعد ${diagnostic ? "جلستك التشخيصية المجانية في الإنجليزية لمدة 20 دقيقة" : "جلستك في الإنجليزية"} هو ${time} (بتوقيت المغرب).`,
    ...(meetingUrl ? [`رابط اللقاء: ${meetingUrl}`] : []),
    "هذه المجموعة للتواصل والتحضير لجلستك. لا تتردد في طرح أسئلتك أو إخبارنا إذا احتجت إلى تغيير الموعد.",
    "نتطلّع إلى لقائك!\nفريق NEXUS Academy",
  ].join("\n\n");
  return [
    `Hello ${client}, welcome to NEXUS Academy!`,
    `We're delighted to support you on your English-learning journey. Your teacher will be ${teacher}.`,
    `As agreed, ${diagnostic ? "your free 20-minute English diagnostic" : "your English session"} is scheduled for ${time} (Morocco time).`,
    ...(meetingUrl ? [`Meeting link: ${meetingUrl}`] : []),
    "We'll use this group to stay in touch and prepare for your session. Feel free to ask questions or let us know if you need to reschedule.",
    "We look forward to meeting you!\nThe NEXUS Academy team",
  ].join("\n\n");
}
