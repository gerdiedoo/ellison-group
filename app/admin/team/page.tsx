import Link from "next/link";
import { queryValues, pageNumber } from "@/lib/validation";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, Select, Check } from "@/lib/admin-fields";
import { updateProfile } from "@/app/actions/crm";
export default async function Team({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const p = queryValues(await searchParams);
  const { db, user } = await requireStaff(true);
  const page = pageNumber(p.page);
  let q = db
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id");
  if (p.q)
    q = q.ilike(
      "full_name",
      "%" + p.q.replace(/[%_]/g, "").slice(0, 100) + "%",
    );
  const {
    data: team,
    error,
    count,
  } = await q.range((page - 1) * 50, page * 50 - 1);
  const url = (n: number) =>
    "/admin/team?" + new URLSearchParams({ ...p, page: String(n) });
  if (error) throw new Error("Unable to load team");
  return (
    <>
      <div className="ph">
        <div>
          <h1>Team Management</h1>
          <p>
            Create accounts using Supabase Auth (invite user), then assign roles
            here. New accounts start as visitors. No user may change their own
            access. Profiles are shown in pages of 50.
          </p>
        </div>
      </div>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Search profiles</label>
          <input name="q" id="q" defaultValue={p.q} />
        </div>
        <button className="btn">Search</button>
      </form>
      <p>{count} matching profiles</p>
      <div className="grid g3">
        {team?.map((t) => (
          <div className="card" key={t.id}>
            <div className="li" style={{ marginBottom: 16, paddingTop: 0 }}>
              <span className="av">
                {(t.full_name || "User")
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="b">
                <h2>{t.full_name || "Unnamed user"}</h2>
                <div className="m">
                  {t.role} · {t.active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
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
      {!team?.length && <p className="empty">No profiles match this search.</p>}
      <nav className="toolbar" aria-label="Team pagination">
        {page > 1 && (
          <Link className="btn" href={url(page - 1)}>
            Previous
          </Link>
        )}
        {page * 50 < (count || 0) && (
          <Link className="btn" href={url(page + 1)}>
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
