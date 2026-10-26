import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/lib/admin-fields";
import { saveSettings } from "@/app/actions/crm";
export default async function Settings() {
  await requireStaff(true);
  const { company: c } = await settings();
  return (
    <>
      <h1>Application Settings</h1>
      <p>
        Company information appears in the public site and verified chatbot
        contact answers.
      </p>
      <div className="card">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="key" value="company" />
          <Field name="name" label="Company name" value={c.name} required />
          <Field name="phone" label="Phone" value={c.phone} />
          <Field name="address" label="Address" value={c.address} />
          <Field
            name="email"
            label="Contact email (optional)"
            value={c.email}
          />
          <Field
            name="instagram"
            label="Instagram HTTPS URL (optional)"
            value={c.instagram}
          />
        </ActionForm>
      </div>
    </>
  );
}
