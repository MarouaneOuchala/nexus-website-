"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { enquiryCopy, getEnquiryClient, isRequestType, type RequestType } from "@/lib/enquiries";
import { getTotal } from "@/lib/pricing";
import { recordAnalyticsActivity } from "@/lib/analytics";

type EnquiryRequest = { type?: RequestType; sessions?: number; goal?: string };
const EnquiryContext = createContext<((request?: EnquiryRequest) => void) | null>(null);

export function useEnquiry() {
  const open = useContext(EnquiryContext);
  if (!open) throw new Error("useEnquiry must be used inside EnquiryProvider");
  return open;
}

function EnquiryDialog({ request, close }: { request: EnquiryRequest; close: () => void }) {
  const { t, lang } = useSettings();
  const copy = enquiryCopy[lang];
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const submissionId = useRef<string | null>(null);
  const [requestType, setRequestType] = useState<RequestType>(request.type ?? "consultation");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const contact = t.contact;
  const sessions = requestType === "application" ? undefined : request.sessions;
  const diagnostic = requestType === "consultation" && !sessions;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const element = dialog.current;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");
    if (phone.length < 8 || phone.length > 15) {
      const input = form.elements.namedItem("phone");
      if (input instanceof HTMLInputElement) {
        input.setCustomValidity(copy.phoneHint);
        input.reportValidity();
      }
      return;
    }
    setError("");
    inFlight.current = true;
    setBusy(true);
    try {
      submissionId.current ??= crypto.randomUUID();
      const client = getEnquiryClient();
      const visitId = await recordAnalyticsActivity(true);
      const { data: id, error: failure } = await client.rpc("submit_enquiry", {
        payload: {
          id: submissionId.current,
          full_name: String(data.get("full_name") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          goal: String(data.get("goal") ?? "").trim(),
          background: String(data.get("background") ?? "").trim(),
          preferred_time: String(data.get("preferred_time") ?? "").trim(),
          request_type: requestType,
          sessions: sessions ?? null,
          language: lang,
          consent: data.get("consent") === "on",
          website: String(data.get("website") ?? ""),
          analytics_visit_id: visitId,
        },
      });
      if (failure) {
        console.error("NEXUS: Enquiry submission failed.", { code: failure.code });
        setError(failure.message.includes("RATE_LIMITED") ? copy.limited : copy.error);
      } else if (!id) {
        console.error("NEXUS: Enquiry submission returned no reference.");
        setError(copy.error);
      } else {
        setReference(id);
      }
    } catch (failure) {
      console.error("NEXUS: Unable to submit enquiry.", failure instanceof Error ? failure.message : "Unknown error");
      setError(failure instanceof Error && failure.message === "SUPABASE_NOT_CONFIGURED" ? copy.unavailable : copy.error);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="enquiry-dialog"
      aria-labelledby="enquiry-title"
      aria-describedby="enquiry-intro"
      onCancel={(event) => { event.preventDefault(); if (!busy) close(); }}
      onClick={(event) => { if (event.target === event.currentTarget && !busy) close(); }}
    >
      <div className="enquiry-dialog-inner">
        <button className="enquiry-close" type="button" onClick={close} disabled={busy} aria-label={copy.close}>×</button>
        <p className="enquiry-kicker">NEXUS / 1:1</p>
        <h2 id="enquiry-title">{diagnostic ? copy.diagnosticTitle : copy.title}</h2>
        <p id="enquiry-intro">{diagnostic ? copy.diagnosticIntro : copy.intro}</p>
        {reference ? (
          <div className="enquiry-success" role="status">
            <p>{diagnostic ? copy.diagnosticSuccess : copy.success}</p>
            <p>{copy.reference}: <code>{reference}</code></p>
            <button className="button button-primary" onClick={close}>{copy.close}</button>
          </div>
        ) : (
          <form className="inquiry-form" onSubmit={submit} aria-busy={busy}>
            <fieldset disabled={busy}>
              <label className="field-label" htmlFor="enquiry-type">{contact.iWant}</label>
              <select id="enquiry-type" value={requestType} onChange={(event) => {
                if (isRequestType(event.target.value)) setRequestType(event.target.value);
              }}>
                <option value="consultation">{contact.options.consultation}</option>
                <option value="course-info">{contact.options.info}</option>
                <option value="application">{contact.options.application}</option>
              </select>
              {sessions && <p className="enquiry-package">{copy.package}: <strong>{sessions} {copy.sessions} · {getTotal(sessions).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} MAD</strong></p>}
              <div className="form-grid">
                <label><span>{contact.name}</span><input name="full_name" autoComplete="name" required minLength={2} maxLength={120} placeholder={contact.namePh} /></label>
                <label><span>{contact.email}</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder={contact.emailPh} /></label>
                <label><span>{contact.phone}</span><input name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+212 6…" aria-describedby="phone-hint" onInput={(event) => event.currentTarget.setCustomValidity("")} /><small id="phone-hint">{copy.phoneHint}</small></label>
                <label><span>{requestType === "application" ? contact.background : contact.goal}</span><input name="goal" defaultValue={request.goal ?? ""} required minLength={2} maxLength={1000} placeholder={requestType === "application" ? contact.backgroundPh : contact.goalPh} /></label>
              </div>
              <label className="enquiry-block"><span>{diagnostic ? copy.diagnosticPreferred : copy.preferred}</span><input name="preferred_time" maxLength={200} placeholder={copy.preferredPh} /></label>
              {requestType === "application" && <label className="enquiry-block"><span>{contact.about}</span><textarea name="background" rows={3} maxLength={3000} required placeholder={contact.aboutPh} /></label>}
              <label className="enquiry-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <label className="consent"><input type="checkbox" name="consent" required /><span>{contact.consent}</span></label>
              <button className="button button-primary submit-button" type="submit">{busy ? copy.sending : diagnostic ? copy.diagnosticSend : copy.send}<span aria-hidden="true">↗</span></button>
            </fieldset>
            {error && <p className="enquiry-error" role="alert">{error}</p>}
            <p className="form-disclaimer">{copy.disclaimer}</p>
          </form>
        )}
      </div>
    </dialog>
  );
}

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<EnquiryRequest | null>(null);
  const open = useCallback((next: EnquiryRequest = {}) => setRequest(next), []);
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href="#contact"]') : null;
      if (!link) return;
      event.preventDefault();
      const type = link.dataset.enquiryType;
      open({ type: type && isRequestType(type) ? type : "consultation", goal: link.dataset.enquiryGoal });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);
  return (
    <EnquiryContext.Provider value={open}>
      {children}
      {request && <EnquiryDialog request={request} close={() => setRequest(null)} />}
    </EnquiryContext.Provider>
  );
}
