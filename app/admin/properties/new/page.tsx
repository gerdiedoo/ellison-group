import { requireStaff } from "@/lib/auth";
import { PropertyEditor } from "@/components/property-editor";
export default async function NewProperty() {
  const { db } = await requireStaff();
  const { data } = await db
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"]);
  return (
    <>
      <h1>Create property</h1>
      <PropertyEditor team={data || []} />
    </>
  );
}
