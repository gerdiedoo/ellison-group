import { PageHeading } from "@/components/admin/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { isRecordId } from "@/lib/validation";
import { InquiryRecord } from "@/components/inquiry-record";
export default async function InquiryDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db } = await requireStaff();
  const { id } = await params;
  if (!isRecordId(id)) notFound();
  const [inquiry, team] = await Promise.all([
    db
      .from("inquiries")
      .select("*,lead:leads(full_name),property:properties(address)")
      .eq("id", id)
      .maybeSingle(),
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
  ]);
  if (inquiry.error || team.error) throw new Error("Unable to load inquiry");
  if (!inquiry.data) notFound();
  return (
    <>
      <Link className="crumb" href="/admin/inquiries">
        ← All inquiries
      </Link>
      <PageHeading title="Inquiry" />
      <InquiryRecord inquiry={inquiry.data} team={team.data || []} />
    </>
  );
}
