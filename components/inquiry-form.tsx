"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { googleSignIn } from "@/app/actions/auth";
import { consentText } from "@/lib/validation";
export type CaptureConfig = {
  headline: string;
  description: string;
  phoneRequired: boolean;
  phoneLabel: string;
  messageLabel: string;
  googleEnabled: boolean;
  googleConfigured?: boolean;
};
export function InquiryForm({
  kind = "General",
  propertyId,
  conversationId,
  config,
  valuation = false,
  onSuccess,
  initialAddress = "",
}: {
  kind?: string;
  propertyId?: string;
  conversationId?: string;
  config: CaptureConfig;
  valuation?: boolean;
  onSuccess?: () => void;
  initialAddress?: string;
}) {
  const [step, setStep] = useState(1),
    [status, setStatus] = useState(""),
    [pending, setPending] = useState(false),
    [done, setDone] = useState(false);
  const requestId = useRef<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (valuation && step < 3) {
      setStep(step + 1);
      return;
    }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    const f = new FormData(form);
    if (pending) return;
    setPending(true);
    setStatus("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId.current,
          full_name: f.get("full_name"),
          email: f.get("email"),
          phone: f.get("phone") || "",
          message: f.get("message") || "",
          kind,
          property_id: propertyId || "",
          conversation_id: conversationId || "",
          consent: f.get("consent") === "on",
          website: f.get("website") || "",
          preferred_date: f.get("preferred_date") || "",
          context: {
            address: f.get("address") || undefined,
            beds: f.get("beds") || undefined,
            timeline: f.get("timeline") || undefined,
            preferred_time: f.get("preferred_time") || undefined,
            contact_method: f.get("contact_method") || undefined,
            purpose: f.get("purpose") || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send request.");
      setDone(true);
      onSuccess?.();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to send request.");
    } finally {
      setPending(false);
    }
  }
  if (done)
    return (
      <div className="notice" role="status">
        <h3>Thank you.</h3>
        <p>
          Your request has been saved for our team to review. Showing dates are
          preferences and require confirmation.
        </p>
        <button
          className="text-button"
          onClick={() => {
            setDone(false);
            setStep(1);
            requestId.current = null;
          }}
        >
          Send another request
        </button>
      </div>
    );
  return (
    <>
      <form onSubmit={submit} className="stack">
        <div>
          <h3>
            {valuation ? "Your personal home valuation" : config.headline}
          </h3>
          <p>{valuation ? `Step ${step} of 3` : config.description}</p>
        </div>
        <div style={{ display: valuation && step !== 1 ? "none" : undefined }}>
          {valuation && (
            <div className="field">
              <label htmlFor="address">Property address</label>
              <input
                defaultValue={initialAddress}
                id="address"
                name="address"
                autoComplete="street-address"
                required={step === 1}
                maxLength={300}
              />
            </div>
          )}
        </div>
        <div style={{ display: valuation && step !== 2 ? "none" : undefined }}>
          {valuation && (
            <>
              <div className="field">
                <label htmlFor="beds">Bedrooms</label>
                <select id="beds" name="beds">
                  <option>1–2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5+</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="timeline">Planning to sell</label>
                <select id="timeline" name="timeline">
                  <option>Within 3 months</option>
                  <option>3–6 months</option>
                  <option>Just exploring</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div style={{ display: valuation && step !== 3 ? "none" : undefined }}>
          <div className="field">
            <label
              htmlFor={"name-" + (conversationId || propertyId || "general")}
            >
              Full name
            </label>
            <input
              id={"name-" + (conversationId || propertyId || "general")}
              name="full_name"
              autoComplete="name"
              required={!valuation || step === 3}
              minLength={2}
              maxLength={120}
            />
          </div>
          <div className="field">
            <label
              htmlFor={"email-" + (conversationId || propertyId || "general")}
            >
              Email
            </label>
            <input
              id={"email-" + (conversationId || propertyId || "general")}
              name="email"
              type="email"
              autoComplete="email"
              required={!valuation || step === 3}
            />
          </div>
          <div className="field">
            <label
              htmlFor={"phone-" + (conversationId || propertyId || "general")}
            >
              {config.phoneLabel}
              {!config.phoneRequired ? " (optional)" : ""}
            </label>
            <input
              id={"phone-" + (conversationId || propertyId || "general")}
              name="phone"
              type="tel"
              autoComplete="tel"
              required={config.phoneRequired && (!valuation || step === 3)}
              maxLength={40}
            />
          </div>
          {kind === "Showing request" && (
            <div className="field">
              <label htmlFor="preferred_date">Preferred showing date</label>
              <input
                id="preferred_date"
                name="preferred_date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          )}
          {kind === "Showing request" && (
            <div className="field">
              <label htmlFor="preferred_time">Preferred showing time</label>
              <select id="preferred_time" name="preferred_time">
                {[
                  "Morning (9–12)",
                  "Afternoon (12–5)",
                  "Evening (5–8)",
                  "Flexible",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label
              htmlFor={
                "contact-method-" + (conversationId || propertyId || "general")
              }
            >
              Preferred contact method
            </label>
            <select
              id={
                "contact-method-" + (conversationId || propertyId || "general")
              }
              name="contact_method"
            >
              {["No preference", "Email", "Phone call", "Text message"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </div>
          {kind === "General" && !propertyId && (
            <div className="field">
              <label htmlFor="purpose">I’m interested in</label>
              <select id="purpose" name="purpose">
                {[
                  "Buying",
                  "Selling",
                  "Selling & buying",
                  "Renting",
                  "Something else",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label
              htmlFor={"message-" + (conversationId || propertyId || "general")}
            >
              {config.messageLabel} (optional)
            </label>
            <textarea
              id={"message-" + (conversationId || propertyId || "general")}
              name="message"
              rows={3}
              maxLength={5000}
            />
          </div>
          <label className="form-check">
            <input
              name="consent"
              type="checkbox"
              required={!valuation || step === 3}
            />
            <span className="policy">
              {consentText}{" "}
              <Link className="text-button" href="/privacy">
                Read privacy policy
              </Link>
            </span>
          </label>
        </div>
        <div className="sr-only" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {status && (
          <p className="error" role="alert">
            {status}
          </p>
        )}
        <div className="inline">
          {valuation && step > 1 && (
            <button
              className="btn ghost"
              type="button"
              onClick={() => setStep(step - 1)}
            >
              ← Back
            </button>
          )}
          <button className="btn solid" disabled={pending}>
            {pending
              ? "Sending…"
              : valuation && step < 3
                ? "Continue →"
                : valuation
                  ? "Request my valuation"
                  : "Send request →"}
          </button>
        </div>
      </form>
      {config.googleEnabled && config.googleConfigured && (
        <form action={googleSignIn} style={{ marginTop: 16 }}>
          <input type="hidden" name="next" value="/contact" />
          <button className="btn ghost">Continue with Google</button>
          <p className="policy">
            After sign-in, submit your request with contact details and consent.
          </p>
        </form>
      )}
    </>
  );
}
