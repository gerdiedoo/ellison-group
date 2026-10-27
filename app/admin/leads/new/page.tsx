import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, Select, Assignment, Check } from "@/lib/admin-fields";
import { createLead } from "@/app/actions/crm";
import { leadStatuses } from "@/lib/validation";
export default async function NewLead() {
  const { db } = await requireStaff();
  const { data: team, error } = await db
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"]);
  if (error) throw new Error("Unable to load team");
  return (
    <>
      <div className="crumb">
        <Link href="/admin/leads">← Leads</Link>
      </div>
      <div className="ph">
        <div>
          <h1>Create lead</h1>
          <p>Add a contact who has given permission for follow-up.</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 700 }}>
        <h2>Contact information</h2>
        <p className="sub">The contact is saved to the shared team CRM.</p>
        <ActionForm action={createLead} label="Create lead">
          <Field name="full_name" label="Full name" required />
          <Field name="email" label="Email" type="email" required />
          <Field name="phone" label="Phone" />
          <Select
            name="status"
            label="Status"
            options={leadStatuses}
            value="New"
          />
          <Assignment team={team || []} />
          <Check
            name="consent"
            label="Contact permission has been obtained for this lead"
          />
        </ActionForm>
      </div>
    </>
  );
}
