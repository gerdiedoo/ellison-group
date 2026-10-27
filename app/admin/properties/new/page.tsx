import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PropertyEditor } from "@/components/property-editor";
export default async function NewProperty() {
  const { db } = await requireStaff();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"]);
  if (error) throw new Error("Unable to load team");
  return (
    <>
      <div className="crumb">
        <Link href="/admin/properties">← Properties</Link>
      </div>
      <div className="ph">
        <div>
          <h1>Create property</h1>
          <p>Add a listing to the shared property catalog.</p>
        </div>
      </div>
      <PropertyEditor team={data || []} />
    </>
  );
}
