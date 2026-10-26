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
  const [{ data: p, error }, { data: team }] = await Promise.all([
    db.from("properties").select("*").eq("id", id).maybeSingle(),
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
  ]);
  if (error) throw new Error("Unable to load property");
  if (!p) notFound();
  return (
    <>
      <Link className="link" href="/admin/properties">
        ← Properties
      </Link>
      <h1>{p.address}</h1>
      <PropertyEditor property={p} team={team || []} />
    </>
  );
}
