import { isRecordId } from "@/lib/validation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { PropertyEditor } from "@/components/property-editor";
export default async function EditProperty({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db } = await requireStaff();
  const { id } = await params;
  if (!isRecordId(id)) notFound();
  const [{ data: p, error }, { data: team, error: teamError }] =
    await Promise.all([
      db.from("properties").select("*").eq("id", id).maybeSingle(),
      db.from("profiles").select("*").in("role", ["agent", "admin"]),
    ]);
  if (error || teamError) throw new Error("Unable to load property");
  if (!p) notFound();
  return (
    <>
      <div className="crumb">
        <Link href="/admin/properties">← Properties</Link>
      </div>
      <div className="ph">
        <div>
          <h1>{p.address}</h1>
          <p>
            {p.location} · {p.listing_status}
          </p>
        </div>
        <Link className="btn ghost" href={"/admin/properties?selected=" + p.id}>
          Property details
        </Link>
      </div>
      <PropertyEditor property={p} team={team || []} />
    </>
  );
}
