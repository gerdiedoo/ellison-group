import { requireStaff } from "@/lib/auth";
import { z } from "zod";
const schema = z.object({
  sources: z.array(z.object({ label: z.string(), value: z.number() })),
  stages: z.array(z.object({ label: z.string(), value: z.number() })),
  properties: z.array(z.object({ label: z.string(), value: z.number() })),
  conversations: z.array(z.object({ label: z.string(), value: z.number() })),
  messages: z.array(z.object({ label: z.string(), value: z.number() })),
});
export default async function Analytics() {
  const { db } = await requireStaff();
  const { data, error } = await db.rpc("crm_analytics");
  if (error) throw new Error("Unable to load analytics");
  const report = schema.parse(data);
  const labels = {
    sources: "Lead sources",
    stages: "Conversion stages",
    properties: "Top property inquiry counts",
    conversations: "Conversation handling",
    messages: "Chatbot and team message activity",
  };
  return (
    <>
      <h1>Analytics</h1>
      <p>
        Lifetime counts from stored records. Conversion stages show each lead’s
        current status.
      </p>
      <div className="two-cols">
        {Object.entries(report).map(([key, rows]) => (
          <div className="card" key={key}>
            <h2>{labels[key as keyof typeof labels]}</h2>
            {rows.length ? (
              rows.map((r) => (
                <div key={r.label} style={{ margin: "16px 0" }}>
                  <div
                    className="inline"
                    style={{ justifyContent: "space-between" }}
                  >
                    <span>{r.label}</span>
                    <strong>{r.value}</strong>
                  </div>
                  <meter
                    aria-label={r.label}
                    min={0}
                    max={Math.max(1, ...rows.map((x) => x.value))}
                    value={r.value}
                    style={{ width: "100%" }}
                  />
                </div>
              ))
            ) : (
              <p>No data yet.</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
