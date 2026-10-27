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
      <h1>Create lead</h1>
      <div className="card">
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
          <Assignment team={team} />
          <Check
            name="consent"
            label="Contact permission has been obtained for this lead"
          />
        </ActionForm>
      </div>
    </>
  );
}
