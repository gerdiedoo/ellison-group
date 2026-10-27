import { z } from "zod";

const optionalValue = z.preprocess(
  (value) => (typeof value === "string" && !value.trim() ? undefined : value),
  z.string().trim().min(1).optional(),
);
const httpUrl = z
  .url()
  .refine((value) => /^https?:\/\//.test(value), "Use an HTTP(S) URL");

const publicSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
      (value) =>
        typeof value === "string" && !value.trim() ? undefined : value,
      httpUrl.optional(),
    ),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalValue,
  })
  .superRefine((value, context) => {
    if (
      Boolean(value.NEXT_PUBLIC_SUPABASE_URL) !==
      Boolean(value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
        message: "Set both Supabase public variables together",
      });
    }
  });

export const serverEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalValue,
  GOOGLE_GEMINI_API_KEY: optionalValue,
  GOOGLE_GEMINI_MODEL: z.preprocess(
    (value) => value || undefined,
    z.string().trim().min(1).default("gemini-2.5-flash"),
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    (value) => value || undefined,
    httpUrl
      .refine((value) => {
        const url = new URL(value);
        return (
          url.pathname === "/" &&
          !url.search &&
          !url.hash &&
          !url.username &&
          !url.password
        );
      }, "Use an origin without a path or credentials")
      .transform((value) => new URL(value).origin)
      .default("http://localhost:3000"),
  ),
  RATE_LIMIT_SALT: z.preprocess(
    (value) => value || undefined,
    z
      .string()
      .min(32)
      .refine(
        (value) => !value.startsWith("replace-"),
        "Replace the example salt",
      )
      .optional(),
  ),
  GOOGLE_OAUTH_ENABLED: z.preprocess(
    (value) => value || "false",
    z.enum(["true", "false"]).transform((value) => value === "true"),
  ),
});

// Report configuration names only. Never include supplied secrets in an error.
function parseConfig<S extends z.ZodType>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const keys = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error("Invalid environment configuration: " + keys.join(", "));
  }
  return result.data;
}

export function parsePublicEnvironment(input: unknown) {
  return parseConfig(publicSchema, input);
}

export function parseServerEnvironment(input: unknown) {
  return parseConfig(serverEnvironmentSchema, input);
}
