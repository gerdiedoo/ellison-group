import { NextResponse } from "next/server";
import { captureSchema, consentText } from "@/lib/validation";
import {
  readPublicJson,
  checkOrigin,
  rateLimit,
  visitor,
} from "@/lib/security";
import { privileged } from "@/lib/supabase/server";
import { settings } from "@/lib/settings";
export async function POST(request: Request) {
  try {
    await checkOrigin();
    await rateLimit("inquiry", 10, 600);
    const input = captureSchema.safeParse(await readPublicJson(request));
    if (!input.success)
      return NextResponse.json(
        { error: input.error.issues[0]?.message || "Check your details." },
        { status: 400 },
      );
    const v = input.data;
    const { capture } = await settings();
    if (capture.phoneRequired && v.phone.replace(/\D/g, "").length < 7)
      return NextResponse.json(
        { error: "Please enter a phone number." },
        { status: 400 },
      );
    await rateLimit("email-inquiry", 6, 3600, v.email);
    const { error } = await privileged().rpc("capture_inquiry", {
      p_data: {
        ...v,
        context: {
          ...v.context,
          submission_contact: {
            full_name: v.full_name,
            email: v.email,
            phone: v.phone,
          },
        },
        consent_text: consentText,
      },
      p_visitor_hash: await visitor(),
    });
    if (error)
      throw new Error(
        "Unable to save your request. Please try again or call our team.",
      );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to save request." },
      { status: 400 },
    );
  }
}
