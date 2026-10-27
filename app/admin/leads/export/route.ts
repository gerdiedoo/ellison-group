import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { leadQuery, type LeadFilters } from "@/lib/crm-data";
import { csvCell } from "@/lib/csv";
export async function GET(request: Request) {
  const { db } = await requireStaff();
  const p = Object.fromEntries(
    new URL(request.url).searchParams,
  ) as LeadFilters;
  const rows = [
    [
      "Name",
      "Email",
      "Phone",
      "Source",
      "Status",
      "Assigned agent ID",
      "Created",
    ]
      .map(csvCell)
      .join(","),
  ];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await leadQuery(db, p).range(offset, offset + 499);
    if (error)
      return NextResponse.json(
        { error: "Unable to export leads." },
        { status: 500 },
      );
    for (const l of data)
      rows.push(
        [
          l.full_name,
          l.email,
          l.phone,
          l.source,
          l.status,
          l.assigned_to,
          l.created_at,
        ]
          .map(csvCell)
          .join(","),
      );
    if (data.length < 500) break;
  }
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ellison-leads.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
