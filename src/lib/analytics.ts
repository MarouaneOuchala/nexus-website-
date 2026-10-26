import { getEnquiryClient } from "@/lib/enquiries";

const CONSENT_KEY = "nexus-analytics-consent";
const VISIT_KEY = "nexus-analytics-visit";
const IDLE_MS = 30 * 60 * 1000;
type Visit = { id: string; activeAt: number; sentAt: number };
let memoryVisit: Visit | null = null;
let pending: Promise<string | null> | null = null;
let consentRevision = 0;

export function analyticsConsent(): "accepted" | "declined" | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch (error) {
    console.warn("NEXUS: Analytics preferences unavailable.", error instanceof Error ? error.message : "Storage blocked");
    return null;
  }
}

export function setAnalyticsConsent(value: "accepted" | "declined") {
  consentRevision++;
  memoryVisit = null;
  try {
    localStorage.setItem(CONSENT_KEY, value);
    localStorage.removeItem(VISIT_KEY);
  } catch (error) {
    console.warn("NEXUS: Analytics preferences could not be saved.", error instanceof Error ? error.message : "Storage blocked");
    throw new Error("ANALYTICS_STORAGE_BLOCKED");
  }
  window.dispatchEvent(new Event("nexus-analytics-consent"));
}

function readVisit(): Visit | null {
  try {
    const raw = localStorage.getItem(VISIT_KEY);
    if (!raw) return memoryVisit;
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null && "id" in value && "activeAt" in value && "sentAt" in value
      && typeof value.id === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value.id)
      && typeof value.activeAt === "number" && Number.isFinite(value.activeAt)
      && typeof value.sentAt === "number" && Number.isFinite(value.sentAt)) return { id: value.id, activeAt: value.activeAt, sentAt: value.sentAt };
    console.warn("NEXUS: Invalid analytics visit storage; starting a new visit.");
    return null;
  } catch (error) {
    console.warn("NEXUS: Analytics visit storage unavailable.", error instanceof Error ? error.message : "Storage blocked");
    return memoryVisit;
  }
}

function saveVisit(visit: Visit) {
  memoryVisit = visit;
  try { localStorage.setItem(VISIT_KEY, JSON.stringify(visit)); }
  catch (error) { console.warn("NEXUS: Analytics visit remains in memory only.", error instanceof Error ? error.message : "Storage blocked"); }
}

export async function recordAnalyticsActivity(force = false): Promise<string | null> {
  if (analyticsConsent() !== "accepted" || document.visibilityState !== "visible"
    || window.location.pathname.startsWith("/admin")) return null;
  if (pending) return pending;
  const revision = consentRevision;
  const now = Date.now();
  const stored = readVisit();
  const visit = stored && now - stored.activeAt < IDLE_MS
    ? stored : { id: crypto.randomUUID(), activeAt: now, sentAt: 0 };
  const previousActiveAt = visit.activeAt;
  visit.activeAt = now;
  if (!stored || now - previousActiveAt >= 1000) saveVisit(visit);
  else memoryVisit = visit;
  if (!force && now - visit.sentAt < 60_000) return visit.id;
  pending = (async () => {
    try {
      const { data, error } = await getEnquiryClient().rpc("record_site_visit", { visit_id: visit.id }).abortSignal(AbortSignal.timeout(5000));
      if (error || !data) throw error ?? new Error("NO_VISIT_RECEIPT");
      if (revision !== consentRevision || analyticsConsent() !== "accepted") return null;
      saveVisit({ id: data, activeAt: visit.activeAt, sentAt: Date.now() });
      return data;
    } catch (error) {
      console.error("NEXUS: Visit tracking failed.", error instanceof Error ? error.message : "Database request failed");
      return null;
    } finally { pending = null; }
  })();
  return pending;
}
