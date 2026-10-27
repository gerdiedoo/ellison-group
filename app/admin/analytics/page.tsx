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
      <div className="ph">
        <div>
          <h1>Analytics</h1>
          <p>
            Lifetime activity from the shared CRM. Conversion stages show each
            lead’s current status.
          </p>
        </div>
      </div>
      <div className="grid g22">
        {Object.entries(report).map(([key, rows]) => {
          const maximum = Math.max(1, ...rows.map((row) => row.value));
          return (
            <div className="card" key={key}>
              <div className="card-h">
                <h2>{labels[key as keyof typeof labels]}</h2>
              </div>
              {rows.length ? (
                rows.map((row, index) => (
                  <div className="bar" key={row.label}>
                    <span>{row.label}</span>
                    <div
                      className="tr"
                      role="meter"
                      aria-label={row.label}
                      aria-valuemin={0}
                      aria-valuemax={maximum}
                      aria-valuenow={row.value}
                    >
                      <b
                        style={{
                          width: `${(row.value / maximum) * 100}%`,
                          background:
                            index % 2 ? "var(--brick)" : "var(--moss)",
                        }}
                      />
                    </div>
                    <strong style={{ textAlign: "right" }}>{row.value}</strong>
                  </div>
                ))
              ) : (
                <div className="empty">
                  <b>No data yet</b>Activity will appear as records are created.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
