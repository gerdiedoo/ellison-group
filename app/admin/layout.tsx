import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
export const dynamic = "force-dynamic";
const links = [
  ["", "Overview"],
  ["leads", "Leads"],
  ["properties", "Properties"],
  ["inquiries", "Inquiries"],
  ["conversations", "Conversations"],
  ["analytics", "Analytics"],
  ["activity", "Activity Log"],
  ["assistant", "AI Assistant"],
  ["lead-capture", "Lead Capture"],
  ["team", "Team"],
  ["settings", "Settings"],
];
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff();
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <Link href="/admin" className="header-brand">
          The Ellison Group
        </Link>
        <p style={{ padding: 10, fontSize: 12 }}>WORKSPACE · {profile.role}</p>
        <nav aria-label="CRM">
          {links
            .filter(
              ([slug]) =>
                profile.role === "admin" ||
                !["assistant", "lead-capture", "settings", "team"].includes(
                  slug,
                ),
            )
            .map(([slug, label]) => (
              <Link href={"/admin" + (slug ? "/" + slug : "")} key={slug}>
                {label}
              </Link>
            ))}
        </nav>
        <Link href="/">View website ↗</Link>
        <form action={signOut}>
          <button className="btn light">Sign out</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
