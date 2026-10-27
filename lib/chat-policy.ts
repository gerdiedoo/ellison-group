import { z } from "zod";
export const selectionSchema = z.object({
  intent: z.enum([
    "search",
    "features",
    "company",
    "valuation",
    "handoff",
    "unknown",
  ]),
  propertyIds: z.array(z.uuid()).max(5),
});
export function factualReply(
  selection: z.infer<typeof selectionSchema>,
  properties: {
    id: string;
    address: string;
    location: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    listing_status: string;
    features: string[];
    description: string;
    slug: string;
  }[],
  company: { name: string; phone: string; address: string },
  handoffEnabled: boolean,
  tone = "Warm, personal and unhurried",
) {
  const selected = properties.filter((p) =>
    selection.propertyIds.includes(p.id),
  );
  if (selection.intent === "handoff")
    return handoffEnabled
      ? "Use “Talk to an agent” to request human assistance. Automated replies will pause. Share your contact details so the team can follow up."
      : "Please contact our team at " +
          company.phone +
          " for human assistance.";
  if (selection.intent === "company")
    return `${company.name}\n${company.address}\n${company.phone}\nI do not have other verified company policies. Please ask our team for details.`;
  if (selection.intent === "valuation")
    return "Our team prepares home valuations personally. Visit /home-valuation to share your address and request one. I cannot estimate a price or confirm a valuation.";
  if (selection.intent === "unknown" || !selected.length)
    return "I don’t have verified information that answers that request in the current listing selection. You can adjust your search at /properties or contact our team for help.";
  return (
    (tone.toLowerCase().includes("concise")
      ? "Matching listings:\n\n"
      : tone.toLowerCase().includes("detailed")
        ? "Here is a closer look at the verified details in our published property records:\n\n"
        : "I’d be happy to help. From our published property records:\n\n") +
    selected
      .map(
        (p) =>
          `${p.address}, ${p.location}\n$${Number(p.price).toLocaleString("en-US")} · ${p.beds} beds · ${p.baths} baths · ${p.sqft.toLocaleString()} sq ft · ${p.listing_status}\n${p.features.length ? "Features: " + p.features.join(", ") : "No additional features recorded."}\n${p.description || ""}\n/properties/${p.slug}`,
      )
      .join("\n\n") +
    "\n\nAvailability may change; an agent must confirm details and showing times. My search covers up to 100 published records; browse the website for the full selection."
  );
}
