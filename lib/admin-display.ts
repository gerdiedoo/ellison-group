/** The prototype's compact timestamps, using one server-provided clock per page. */
export function relativeTime(value: string, now: number) {
  const difference = now - Date.parse(value);
  if (!Number.isFinite(difference)) return "Unknown time";
  const elapsed = Math.abs(difference);
  if (elapsed < 60000) return "just now";
  const amount =
    elapsed < 3600000
      ? `${Math.round(elapsed / 60000)} min`
      : elapsed < 86400000
        ? `${Math.round(elapsed / 3600000)} hr`
        : elapsed < 30 * 86400000
          ? `${Math.round(elapsed / 86400000)} d`
          : `${Math.round(elapsed / (30 * 86400000))} mo`;
  return difference < 0 ? `in ${amount}` : `${amount} ago`;
}

/** Describe only the operation recorded by the immutable server audit trigger. */
export function activityDescription(action: string, entity: string) {
  const labels: Record<string, [string, string, string]> = {
    profiles: ["Team profile created", "Team profile updated", "Team profile removed"],
    leads: ["Lead captured", "Lead information updated", "Lead removed"],
    properties: ["Property created", "Property updated", "Property removed"],
    inquiries: ["Inquiry submitted", "Inquiry updated", "Inquiry removed"],
    lead_properties: ["Interested property added", "Property interest updated", "Interested property removed"],
    conversations: ["Conversation started", "Conversation updated", "Conversation removed"],
    messages: ["Conversation message added", "Conversation message updated", "Conversation message removed"],
    notes: ["Internal note added", "Internal note updated", "Internal note removed"],
    tasks: ["Follow-up reminder added", "Follow-up reminder updated", "Follow-up reminder removed"],
    settings: ["Application settings created", "Application settings updated", "Application settings removed"],
    favorites: ["Property saved", "Saved property updated", "Saved property removed"],
  };
  const index = { INSERT: 0, UPDATE: 1, DELETE: 2 }[action];
  return index === undefined || !labels[entity]
    ? "CRM record changed"
    : labels[entity][index];
}
