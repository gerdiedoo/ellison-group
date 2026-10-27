import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { ActionForm } from "@/components/action-form";
import { Field } from "@/lib/admin-fields";
import { saveSettings } from "@/app/actions/crm";
export default async function Settings() {
  const { profile } = await requireStaff(true);
  const { company: c } = await settings();
  return (
    <>
      <div className="ph">
        <div>
          <h1>Settings</h1>
          <p>
            Company information, staff access and shared website configuration.
          </p>
        </div>
      </div>
      <div className="grid g22">
        <div className="card">
          <h2>Company profile</h2>
          <p className="sub">
            These details appear on the public site and in verified assistant
            contact answers.
          </p>
          <ActionForm action={saveSettings} className="settings-form">
            <input type="hidden" name="key" value="company" />
            <Field name="name" label="Company name" value={c.name} required />
            <Field name="phone" label="Phone" value={c.phone} />
            <Field name="address" label="Address" value={c.address} />
            <Field
              name="email"
              label="Contact email (optional)"
              value={c.email}
            />
            <Field
              name="instagram"
              label="Instagram HTTPS URL (optional)"
              value={c.instagram}
            />
          </ActionForm>
        </div>
        <div className="card">
          <h2>Your profile</h2>
          <p className="sub">
            Changes and notes are attributed to your authenticated account.
          </p>
          <div className="li">
            <span className="av">
              {(profile.full_name || "A")
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="b">
              <div className="t">{profile.full_name || "Administrator"}</div>
              <div className="m">
                Administrator · {profile.active ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
          <h2 style={{ marginTop: 24 }}>Data & access</h2>
          <p className="sub">
            Manage your team and export records from the shared CRM.
          </p>
          <div className="pill-row">
            <Link className="btn" href="/admin/team">
              Manage team
            </Link>
            <a
              className="btn"
              href="/admin/leads/export"
              download="ellison-leads.csv"
            >
              Export leads (CSV)
            </a>
            <Link className="btn" href="/" target="_blank" rel="noopener">
              Open public site ↗
            </Link>
          </div>
          <h2 style={{ marginTop: 24 }}>Website settings</h2>
          {[
            [
              "/admin/assistant",
              "AI assistant",
              "Welcome message, tone and human assistance",
            ],
            [
              "/admin/lead-capture",
              "Lead capture",
              "Required fields and public form copy",
            ],
            [
              "/admin/activity",
              "Activity log",
              "Server-created history of changes",
            ],
          ].map(([href, title, description]) => (
            <Link className="li" key={href} href={href}>
              <div className="b">
                <div className="t">{title}</div>
                <div className="m">{description}</div>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
