import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import "./prototype.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin — The Ellison Group",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, user, profile } = await requireStaff();
  const [leads, conversations] = await Promise.all([
    db
      .from("leads")
      .select("id", { count: "exact" })
      .eq("status", "New")
      .limit(1),
    db
      .from("conversations")
      .select("id", { count: "exact" })
      .eq("status", "human")
      .limit(1),
  ]);
  if (
    leads.error ||
    conversations.error ||
    leads.count === null ||
    conversations.count === null
  )
    throw new Error("Unable to load workspace navigation");
  return (
    <AdminShell
      profile={profile}
      email={user.email || ""}
      badges={{ leads: leads.count, conversations: conversations.count }}
    >
      {children}
    </AdminShell>
  );
}
