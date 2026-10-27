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
      <h1>Create property</h1>
      <PropertyEditor team={data || []} />
    </>
  );
}
