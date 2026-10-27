import { z } from "zod";
export const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Appointment Scheduled",
  "Nurturing",
  "Converted",
  "Lost",
] as const;
export const inquiryStatuses = [
  "New",
  "In progress",
  "Responded",
  "Scheduled",
  "Closed",
] as const;
export const inquiryKinds = [
  "General",
  "Property question",
  "Showing request",
  "Valuation request",
  "Newsletter",
  "Chatbot handoff",
] as const;
export const consentText =
  "I agree that The Ellison Group may contact me about this request and acknowledge the privacy policy.";
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const captureSchema = z
  .object({
    request_id: z.uuid(),
    full_name: z.string().trim().min(2).max(120),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+()0-9. x-]*$/, "Enter a valid phone number"),
    message: z.string().trim().max(5000).default(""),
    kind: z.enum(inquiryKinds),
    property_id: z.union([z.uuid(), z.literal("")]).optional(),
    conversation_id: z.union([z.uuid(), z.literal("")]).optional(),
    consent: z.literal(true),
    website: z.string().max(0).default(""),
    preferred_date: z.iso.date().or(z.literal("")).optional(),
    context: z
      .object({
        address: z.string().trim().max(300).optional(),
        beds: z.string().max(20).optional(),
        timeline: z.string().max(80).optional(),
        preferred_time: z
          .enum([
            "Morning (9–12)",
            "Afternoon (12–5)",
            "Evening (5–8)",
            "Flexible",
          ])
          .optional(),
        contact_method: z
          .enum(["No preference", "Email", "Phone call", "Text message"])
          .optional(),
        purpose: z
          .enum([
            "Buying",
            "Selling",
            "Selling & buying",
            "Renting",
            "Something else",
          ])
          .optional(),
      })
      .default({}),
  })
  .superRefine((v, c) => {
    if (v.kind === "Valuation request" && !v.context.address?.trim())
      c.addIssue({
        code: "custom",
        message: "Property address is required",
        path: ["context", "address"],
      });
    if (v.kind === "Showing request" && !v.preferred_date)
      c.addIssue({
        code: "custom",
        message: "Please choose a preferred date",
        path: ["preferred_date"],
      });
    if (
      v.preferred_date &&
      (Number.isNaN(Date.parse(v.preferred_date)) ||
        v.preferred_date < new Date().toISOString().slice(0, 10))
    )
      c.addIssue({
        code: "custom",
        message: "Choose a valid future date",
        path: ["preferred_date"],
      });
  });
export const propertySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  address: z.string().trim().min(3).max(240),
  location: z.string().trim().min(2).max(240),
  neighborhood: z.string().min(2).max(120),
  property_type: z.string().min(2).max(100),
  price: z.coerce.number().min(0).max(999999999999),
  beds: z.coerce.number().int().min(0).max(100),
  baths: z.coerce.number().min(0).max(100),
  sqft: z.coerce.number().int().min(0).max(10000000),
  description: z.string().max(20000),
  features: z.array(z.string().max(160)).max(100),
  listing_status: z.enum(["For Sale", "Pending", "Sold"]),
  published: z.boolean(),
  assigned_to: z.uuid().nullable(),
  illustration: z.enum([
    "stone",
    "stucco",
    "brick",
    "columns",
    "porch",
    "ranch",
    "tower",
    "lot",
  ]),
});
export const assistantSchema = z.object({
  enabled: z.boolean(),
  welcome: z.string().trim().min(1).max(2000),
  tone: z.string().max(300),
  instructions: z.string().max(4000),
  handoffEnabled: z.boolean(),
});
export const captureSettingsSchema = z.object({
  headline: z.string().trim().min(1).max(200),
  description: z.string().max(1000),
  phoneRequired: z.boolean(),
  phoneLabel: z.string().trim().min(1).max(80),
  messageLabel: z.string().trim().min(1).max(80),
  googleEnabled: z.boolean(),
});
export const companySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().max(80),
  address: z.string().max(300),
  email: z.union([emailSchema, z.literal("")]),
  instagram: z.union([
    z.url().refine((v) => v.startsWith("https://")),
    z.literal(""),
  ]),
});
export function safeNext(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return "/admin";
  try {
    return new URL(value, "https://local.invalid").origin ===
      "https://local.invalid"
      ? value
      : "/admin";
  } catch {
    return "/admin";
  }
}

export function pageNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(10000, Math.floor(n))) : 1;
}

// App Router query parameters may contain repeated values. Never treat an array
// as a string or coerce attacker-controlled objects into database filters.
export function queryValues(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).flatMap(([key, raw]) => {
      const value = Array.isArray(raw) ? raw[0] : raw;
      return typeof value === "string" ? [[key, value]] : [];
    }),
  );
}
export const isRecordId = (value: unknown): value is string =>
  z.uuid().safeParse(value).success;
