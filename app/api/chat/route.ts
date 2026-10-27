import { requestsHuman } from "@/lib/chat-handoff";
import { NextResponse } from "next/server";
import { z } from "zod";
import { privileged } from "@/lib/supabase/server";
import {
  readPublicJson,
  checkOrigin,
  rateLimit,
  visitor,
} from "@/lib/security";
import { settings } from "@/lib/settings";
import { assistantReply } from "@/lib/gemini";
export const maxDuration = 60;
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), propertyId: z.uuid().optional() }),
  z.object({
    action: z.enum(["message", "handoff"]),
    id: z.uuid(),
    body: z.string().trim().min(1).max(2000),
  }),
]);
async function snapshot(id: string, hash: string) {
  const db = privileged();
  const { data: c, error } = await db
    .from("conversations")
    .select("id,status,updated_at,property_id")
    .eq("id", id)
    .eq("visitor_hash", hash)
    .maybeSingle();
  if (error || !c) return null;
  const { data: messages, error: me } = await db
    .from("messages")
    .select("id,sender,body,created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (me) throw new Error("Unable to load conversation");
  return { ...c, messages: messages.reverse() };
}
export async function GET(request: Request) {
  try {
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    const hash = await visitor();
    if (!hash)
      return NextResponse.json(
        { error: "Conversation unavailable" },
        { status: 404 },
      );
    await rateLimit("chat-poll", 120, 60, hash);
    const data = await snapshot(id, hash);
    return NextResponse.json(data || { error: "Conversation unavailable" }, {
      status: data ? 200 : 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Conversation unavailable" },
      { status: 400 },
    );
  }
}
export async function POST(request: Request) {
  try {
    await checkOrigin();
    await rateLimit("chat-ip", 30, 600);
    const input = schema.parse(await readPublicJson(request));
    const hash = (await visitor(true))!;
    const config = await settings();
    const db = privileged();
    if (input.action === "start") {
      if (!config.assistant.enabled)
        throw new Error("The assistant is currently disabled.");
      await rateLimit("chat-start", 8, 3600, hash);
      if (input.propertyId) {
        const { data: p } = await db
          .from("properties")
          .select("id")
          .eq("id", input.propertyId)
          .eq("published", true)
          .maybeSingle();
        if (!p) throw new Error("Property unavailable");
      }
      const { data: c, error } = await db
        .from("conversations")
        .insert({ visitor_hash: hash, property_id: input.propertyId || null })
        .select("id")
        .single();
      if (error) throw new Error("Unable to start conversation");
      const { error: me } = await db.from("messages").insert({
        conversation_id: c.id,
        sender: "assistant",
        body: config.assistant.welcome,
      });
      if (me) {
        await db
          .from("conversations")
          .delete()
          .eq("id", c.id)
          .eq("visitor_hash", hash);
        throw new Error("Unable to initialize conversation");
      }
      return NextResponse.json(await snapshot(c.id, hash));
    }
    if (input.action === "handoff" && !config.assistant.handoffEnabled)
      throw new Error("Please use the contact page to reach our team.");
    await rateLimit("chat-send", 30, 600, hash);
    const { data: lease, error } = await db.rpc("begin_chat", {
      p_id: input.id,
      p_hash: hash,
      p_body: input.body,
      p_handoff:
        input.action === "handoff" ||
        (config.assistant.handoffEnabled && requestsHuman(input.body)),
    });
    if (error)
      throw new Error(
        "Conversation unavailable, resolved, or processing a previous reply. Please try again.",
      );
    const state = z
      .object({ status: z.string(), revision: z.number() })
      .parse(lease);
    if (state.status === "bot") {
      const current = await snapshot(input.id, hash);
      if (!current) throw new Error("Conversation unavailable");
      let reply: string;
      try {
        if (!config.assistant.enabled)
          throw new Error(
            "The AI assistant is currently disabled. Please contact our team.",
          );
        reply = await assistantReply(current.messages);
      } catch (e) {
        console.error(
          "Assistant request failed:",
          e instanceof Error ? e.name : "Unknown error",
          typeof e === "object" && e !== null && "status" in e
            ? Number(e.status)
            : "no provider status",
        );
        reply = process.env.GOOGLE_GEMINI_API_KEY
          ? "The AI service is temporarily unavailable. Please request human assistance or contact our team."
          : "The AI assistant is not configured. Please request human assistance or contact our team.";
      }
      const { error: finishError } = await db.rpc("finish_chat", {
        p_id: input.id,
        p_hash: hash,
        p_revision: state.revision,
        p_body: reply,
      });
      if (finishError)
        throw new Error(
          "Unable to save the assistant reply. Please retry later.",
        );
    }
    return NextResponse.json(await snapshot(input.id, hash));
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Please enter a valid message."
            : e instanceof Error
              ? e.message
              : "Unable to process chat.",
      },
      { status: 400 },
    );
  }
}
