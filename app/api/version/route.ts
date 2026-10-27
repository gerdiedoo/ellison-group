export const dynamic = "force-dynamic";

/** Public identifiers let a local or hosted server be checked without sign-in. */
export function GET() {
  return Response.json(
    {
      application: "The Ellison Group",
      interfaceRevision: process.env.ELLISON_INTERFACE_REVISION,
      sourceCommit: process.env.ELLISON_BUILD_COMMIT,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
