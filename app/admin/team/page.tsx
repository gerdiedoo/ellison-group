import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, Select, Check } from "@/lib/admin-fields";
import { updateProfile } from "@/app/actions/crm";
export default async function Team({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const p = await searchParams;
  const { db, user } = await requireStaff(true);
  let q = db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (p.q)
    q = q.ilike(
      "full_name",
      "%" + p.q.replace(/[%_]/g, "").slice(0, 100) + "%",
    );
  const { data: team, error } = await q;
  if (error) throw new Error("Unable to load team");
  return (
    <>
      <h1>Team Management</h1>
      <p>
        Create accounts using Supabase Auth (invite user), then assign roles
        here. New accounts start as visitors. No user may change their own
        access. Showing up to 100 matching profiles.
      </p>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Search profiles</label>
          <input name="q" id="q" defaultValue={p.q} />
        </div>
        <button className="btn">Search</button>
      </form>
      <div className="grid">
        {team?.map((t) => (
          <div className="card" key={t.id}>
            <h2>{t.full_name || "Unnamed user"}</h2>
            <small style={{ overflowWrap: "anywhere" }}>{t.id}</small>
            {t.id === user.id ? (
              <p className="notice">Your account · {t.role} · active</p>
            ) : (
              <ActionForm action={updateProfile}>
                <input type="hidden" name="id" value={t.id} />
                <Field
                  name="full_name"
                  label="Full name"
                  value={t.full_name}
                  required
                />
                <Select
                  name="role"
                  label="Role"
                  options={["visitor", "agent", "admin"]}
                  value={t.role}
                />
                <Check name="active" label="Active" checked={t.active} />
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
