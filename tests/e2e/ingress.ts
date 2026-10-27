import type { Page } from "@playwright/test";
// Emulate a trusted local ingress only on this application's origin. Do not send
// test forwarding headers to Google Fonts or Supabase image URLs.
export async function testIngress(
  page: Page,
  token: string,
  subnet = "192.0.2",
) {
  const headers = {
    "x-real-ip": `${subnet}.${1 + (parseInt(token.slice(0, 2), 16) % 250)}`,
  };
  await page.route("http://localhost:3000/**", (route) =>
    route.continue({ headers: { ...route.request().headers(), ...headers } }),
  );
  return headers;
}
