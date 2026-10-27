import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { Select, Assignment } from "@/lib/admin-fields";
import { updateInquiry } from "@/app/actions/crm";
import { inquiryStatuses } from "@/lib/validation";
import type { Inquiry, Profile } from "@/lib/database.types";
export type InquiryWithContacts = Inquiry & {
  lead: { full_name: string } | null;
  property: { address: string } | null;
};
export function InquiryRecord({
  inquiry: i,
  team,
}: {
  inquiry: InquiryWithContacts;
  team: Profile[];
}) {
  return (
    <article className="card" id={i.id}>
      <div className="grid g22">
        <div>
          <span className="sub">{i.kind}</span>
          <h2>
            <Link href={"/admin/leads/" + i.lead_id}>
              {i.lead?.full_name || "View lead"}
            </Link>
          </h2>
          {i.property_id && (
            <p>
              <Link
                className="link"
                href={"/admin/properties/" + i.property_id}
              >
                {i.property?.address || "View property"}
              </Link>
            </p>
          )}
          <p style={{ whiteSpace: "pre-wrap" }}>
            {i.message || "No message provided."}
          </p>
          <p>Submitted {i.created_at}</p>
          <Link className="link" href={"/admin/inquiries/" + i.id}>
            Open inquiry
          </Link>
          {i.preferred_date && (
            <p>Preferred date: {i.preferred_date} (unconfirmed)</p>
          )}
          {i.context && (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
              {JSON.stringify(i.context, null, 2)}
            </pre>
          )}
        </div>
        <ActionForm action={updateInquiry}>
          <input type="hidden" name="id" value={i.id} />
          <Select
            name="status"
            label="Status"
            options={inquiryStatuses}
            value={i.status}
          />
          <Assignment team={team || []} value={i.assigned_to} />
        </ActionForm>
      </div>
    </article>
  );
}
