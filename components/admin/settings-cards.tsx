import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Field, Area } from "@/lib/admin-fields";
import { saveSettings } from "@/app/actions/crm";
import type { settings } from "@/lib/settings";

type Settings = Awaited<ReturnType<typeof settings>>;
export function SettingToggle({
  name,
  label,
  description,
  checked,
  disabled = false,
}: {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="tog">
      <input
        type="checkbox"
        name={name}
        aria-label={label}
        defaultChecked={checked}
        disabled={disabled}
      />
      <span className="sw" aria-hidden="true" />
      <span className="t">
        {label}
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}
export function AssistantCard({
  assistant: a,
  label = "Save changes",
}: {
  assistant: Settings["assistant"];
  label?: string;
}) {
  return (
    <div className="card" id="cbc">
      <h2>AI chatbot</h2>
      <p className="sub">
        The assistant on the public site. Saved changes apply to new replies.
      </p>
      <ActionForm action={saveSettings} label={label} className="settings-form">
        <input type="hidden" name="key" value="assistant" />
        <SettingToggle
          name="enabled"
          label="Enable public chatbot"
          description="Show the assistant on the public site."
          checked={a.enabled}
        />
        <Area
          name="welcome"
          label="Welcome message"
          value={a.welcome}
          rows={3}
        />
        <Field name="tone" label="Tone preference" value={a.tone} />
        <Area
          name="instructions"
          label="Assistant instructions (cannot override factual constraints)"
          value={a.instructions}
          rows={4}
        />
        <SettingToggle
          name="handoffEnabled"
          label="Allow visitor requests for human handoff"
          description="Visitors can pause automated replies and join the team's inbox."
          checked={a.handoffEnabled}
        />
      </ActionForm>
      <div className="pill-row" style={{ marginTop: 16 }}>
        <Link
          className="btn ghost"
          href="/properties"
          target="_blank"
          rel="noopener"
        >
          Open public assistant ↗
        </Link>
      </div>
    </div>
  );
}
export function CaptureCard({ capture: c }: { capture: Settings["capture"] }) {
  return (
    <div className="card" id="cpc">
      <h2>Lead capture</h2>
      <p className="sub">
        Contact forms for property questions, showings, valuations and
        follow-up.
      </p>
      <ActionForm action={saveSettings} className="settings-form">
        <input type="hidden" name="key" value="capture" />
        <div
          style={{
            margin: "14px 0 4px",
            fontSize: 12,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Required contact fields
        </div>
        <SettingToggle
          name="requiredName"
          label="Full name"
          description="Required to submit a request."
          checked
          disabled
        />
        <SettingToggle
          name="requiredEmail"
          label="Email address"
          description="Always required. Returning inquiries use the same lead record."
          checked
          disabled
        />
        <SettingToggle
          name="phoneRequired"
          label="Require phone number"
          checked={c.phoneRequired}
        />
        <div
          style={{
            margin: "14px 0 4px",
            fontSize: 12,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Sign-in option
        </div>
        <SettingToggle
          name="googleEnabled"
          label="Offer Google sign-in alongside inquiry forms (requires OAuth configuration)"
          description="Visitors can still browse and inquire without signing in."
          checked={c.googleEnabled}
        />
        <Field name="headline" label="Form headline" value={c.headline} />
        <Area
          name="description"
          label="Form description"
          value={c.description}
          rows={3}
        />
        <Field
          name="phoneLabel"
          label="Phone field label"
          value={c.phoneLabel}
        />
        <Field
          name="messageLabel"
          label="Message field label"
          value={c.messageLabel}
        />
      </ActionForm>
      <div className="pill-row" style={{ marginTop: 16 }}>
        <Link
          className="btn ghost"
          href="/contact"
          target="_blank"
          rel="noopener"
        >
          Open public form ↗
        </Link>
      </div>
    </div>
  );
}
