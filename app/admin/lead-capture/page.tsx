import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { ActionForm } from "@/components/action-form";
import { Field, Area, Check } from "@/lib/admin-fields";
import { saveSettings } from "@/app/actions/crm";
export default async function CaptureSettings() {
  await requireStaff(true);
  const { capture: c } = await settings();
  return (
    <>
      <h1>Lead Capture</h1>
      <p>
        Browsing is always open. Name, email and privacy consent are required to
        submit an inquiry. These settings apply to the supported public forms.
      </p>
      <div className="card">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="key" value="capture" />
          <Field name="headline" label="Form headline" value={c.headline} />
          <Area
            name="description"
            label="Form description"
            value={c.description}
          />
          <Check
            name="phoneRequired"
            label="Require phone number"
            checked={c.phoneRequired}
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
          <Check
            name="googleEnabled"
            label="Offer Google sign-in alongside inquiry forms (requires OAuth configuration)"
            checked={c.googleEnabled}
          />
        </ActionForm>
      </div>
    </>
  );
}
