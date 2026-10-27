import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { AssistantCard } from "@/components/admin/settings-cards";
export default async function AssistantSettings() {
  const { db } = await requireStaff(true);
  const [{ assistant }, total, active, waiting, handed, leads] =
    await Promise.all([
      settings(),
      db.from("conversations").select("id", { count: "exact" }).limit(1),
      db
        .from("conversations")
        .select("id", { count: "exact" })
        .eq("status", "bot")
        .limit(1),
      db
        .from("conversations")
        .select("id", { count: "exact" })
        .eq("status", "human")
        .is("assigned_to", null)
        .limit(1),
      db
        .from("conversations")
        .select("id", { count: "exact" })
        .eq("status", "human")
        .not("assigned_to", "is", null)
        .limit(1),
      db
        .from("leads")
        .select("id", { count: "exact" })
        .eq("source", "chatbot")
        .limit(1),
    ]);
  if (
    [total, active, waiting, handed, leads].some(
      (result) => result.error || result.count === null,
    )
  )
    throw new Error("Unable to load assistant activity");
  const metrics = [
    ["Conversations", total.count, `${active.count} active`],
    ["Needs follow-up", waiting.count, "Waiting on the team"],
    ["Handed to agent", handed.count, "Agent-managed"],
    ["Chatbot leads", leads.count, "Source: AI chatbot"],
  ] as const;
  return (
    <>
      <div className="ph">
        <div>
          <h1>AI Assistant</h1>
          <p>
            An assistant that answers from the listing data and hands off to the
            team.
          </p>
        </div>
      </div>
      <div className="grid g4">
        {metrics.map(([label, value, description]) => (
          <div className="card kpi" key={label}>
            <div className="l">{label}</div>
            <div className="v">{value}</div>
            <div className="d">{description}</div>
          </div>
        ))}
      </div>
      <div className="grid g22">
        <AssistantCard assistant={assistant} />
        <div className="card">
          <h2>What it can do</h2>
          <p className="sub">Explore these on the public site.</p>
          {[
            "Find published homes by budget, bedrooms and neighborhood.",
            "Explain a listing’s recorded price, beds, baths, size and status.",
            "Explain the valuation request process without estimating a price.",
            "Offer a showing or a human agent and collect contact details with consent.",
            "Keep conversation history and associate it with the lead.",
            "Say when information is unavailable and offer the team’s help.",
          ].map((text) => (
            <div className="li" key={text}>
              <span className="dot" style={{ background: "var(--moss)" }} />
              <div className="b">{text}</div>
            </div>
          ))}
          <h3 style={{ fontSize: 18, margin: "22px 0 8px" }}>
            Saved welcome message
          </h3>
          <div className="mg bot" style={{ maxWidth: "100%" }}>
            <small>Assistant</small>
            {assistant.welcome}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link className="btn" href="/admin/conversations">
              Open conversation inbox
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
