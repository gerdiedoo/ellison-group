"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import {
  propertySchema,
  leadStatuses,
  inquiryStatuses,
  assistantSchema,
  captureSettingsSchema,
  companySchema,
} from "@/lib/validation";
import type { ActionState } from "@/components/action-form";
const id = (f: FormData, key = "id") => z.uuid().parse(f.get(key));
const str = (f: FormData, key: string) => String(f.get(key) || "").trim();
const checked = (f: FormData, key: string) => f.get(key) === "on";
const fail = (e: unknown): ActionState => ({
  error:
    e instanceof z.ZodError
      ? e.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")
      : e instanceof Error
        ? e.message
        : "Unable to save changes.",
});
function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
async function assignment(
  db: Awaited<ReturnType<typeof requireStaff>>["db"],
  f: FormData,
) {
  const assigned = str(f, "assigned_to");
  if (!assigned) return null;
  z.uuid().parse(assigned);
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("id", assigned)
    .eq("active", true)
    .in("role", ["agent", "admin"])
    .maybeSingle();
  if (!data) throw new Error("Choose an active team member.");
  return assigned;
}
export async function updateLead(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const patch = {
      full_name: z.string().min(2).max(120).parse(str(f, "full_name")),
      phone: z.string().max(40).parse(str(f, "phone")),
      status: z.enum(leadStatuses).parse(f.get("status")),
      assigned_to: await assignment(db, f),
    };
    const { error } = await db.from("leads").update(patch).eq("id", id(f));
    if (error) throw new Error("Unable to update lead.");
    refresh();
    return { success: "Lead updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function addNote(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db, user } = await requireStaff();
  try {
    const body = z.string().min(1).max(10000).parse(str(f, "body"));
    const lead_id = str(f, "lead_id") ? id(f, "lead_id") : null;
    const conversation_id = str(f, "conversation_id")
      ? id(f, "conversation_id")
      : null;
    if (!lead_id && !conversation_id) throw new Error("A record is required");
    const { error } = await db
      .from("notes")
      .insert({ body, lead_id, conversation_id, author_id: user.id });
    if (error) throw new Error("Unable to add note.");
    refresh();
    return { success: "Note added." };
  } catch (e) {
    return fail(e);
  }
}
export async function addTask(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const title = z.string().min(1).max(500).parse(str(f, "title"));
    const due_at = z.iso
      .datetime()
      .parse(new Date(str(f, "due_at") + "T17:00:00Z").toISOString());
    const { error } = await db.from("tasks").insert({
      lead_id: id(f, "lead_id"),
      title,
      due_at,
      assigned_to: await assignment(db, f),
    });
    if (error) throw new Error("Unable to add task.");
    refresh();
    return { success: "Follow-up task added." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateTask(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const { error } = await db
      .from("tasks")
      .update({ done: checked(f, "done") })
      .eq("id", id(f));
    if (error) throw new Error("Unable to update task");
    refresh();
    return { success: "Task updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateInquiry(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const { error } = await db
      .from("inquiries")
      .update({
        status: z.enum(inquiryStatuses).parse(f.get("status")),
        assigned_to: await assignment(db, f),
      })
      .eq("id", id(f));
    if (error) throw new Error("Unable to update inquiry");
    refresh();
    return { success: "Inquiry updated." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateConversation(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const status = z.enum(["bot", "human", "resolved"]).parse(f.get("status"));
    const { error } = await db
      .from("conversations")
      .update({
        status,
        assigned_to: await assignment(db, f),
        processing_until: null,
      })
      .eq("id", id(f));
    if (error) throw new Error("Unable to update conversation");
    refresh();
    return {
      success:
        status === "bot"
          ? "Bot handling resumed."
          : status === "human"
            ? "Human handling enabled; bot replies are paused."
            : "Conversation resolved.",
    };
  } catch (e) {
    return fail(e);
  }
}
export async function replyConversation(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    const body = z.string().min(1).max(10000).parse(str(f, "body"));
    const { error } = await db.rpc("agent_reply", {
      p_id: id(f, "conversation_id"),
      p_body: body,
    });
    if (error)
      throw new Error("Reply failed. Enable human handling before replying.");
    refresh();
    return {
      success: "Reply saved. The visitor will see it on their next refresh.",
    };
  } catch (e) {
    return fail(e);
  }
}
export async function saveSettings(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff(true);
  try {
    const key = z.enum(["company", "assistant", "capture"]).parse(f.get("key"));
    let value;
    if (key === "company")
      value = companySchema.parse({
        name: str(f, "name"),
        phone: str(f, "phone"),
        address: str(f, "address"),
        email: str(f, "email"),
        instagram: str(f, "instagram"),
      });
    else if (key === "assistant")
      value = assistantSchema.parse({
        enabled: checked(f, "enabled"),
        welcome: str(f, "welcome"),
        tone: str(f, "tone"),
        instructions: str(f, "instructions"),
        handoffEnabled: checked(f, "handoffEnabled"),
      });
    else
      value = captureSettingsSchema.parse({
        headline: str(f, "headline"),
        description: str(f, "description"),
        phoneRequired: checked(f, "phoneRequired"),
        phoneLabel: str(f, "phoneLabel"),
        messageLabel: str(f, "messageLabel"),
        googleEnabled: checked(f, "googleEnabled"),
      });
    const { error } = await db
      .from("settings")
      .update({ value })
      .eq("key", key);
    if (error) throw new Error("Unable to save settings.");
    refresh();
    return { success: "Settings saved." };
  } catch (e) {
    return fail(e);
  }
}
export async function updateProfile(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db, user } = await requireStaff(true);
  try {
    const target = id(f);
    if (target === user.id)
      throw new Error("You cannot change your own access.");
    const patch = {
      full_name: z.string().min(2).max(120).parse(str(f, "full_name")),
      role: z.enum(["visitor", "agent", "admin"]).parse(f.get("role")),
      active: checked(f, "active"),
    };
    const { error } = await db.from("profiles").update(patch).eq("id", target);
    if (error) throw new Error("Unable to update team member");
    refresh();
    return { success: "Team profile updated." };
  } catch (e) {
    return fail(e);
  }
}
function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  )
    return "image/png";
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function saveProperty(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  const uploaded: string[] = [];
  let saved = false;
  let propertyId = "";
  let created = false;
  try {
    propertyId = str(f, "id") ? id(f) : crypto.randomUUID();
    created = !str(f, "id");
    const patch = propertySchema.parse({
      ...Object.fromEntries(f),
      price: str(f, "price"),
      beds: str(f, "beds"),
      baths: str(f, "baths"),
      sqft: str(f, "sqft"),
      features: str(f, "features")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      published: checked(f, "published"),
      assigned_to: await assignment(db, f),
    });
    const files = f
      .getAll("photos")
      .filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length > 12)
      throw new Error("Upload at most 12 photos at a time.");
    let images: string[] = [];
    if (!created) {
      const { data: p, error } = await db
        .from("properties")
        .select("images")
        .eq("id", propertyId)
        .single();
      if (error || !p) throw new Error("Property not found");
      images = p.images;
    }
    const remove = f.getAll("remove_images").map(String);
    images = images.filter((url) => !remove.includes(url));
    if (created) {
      const { error } = await db
        .from("properties")
        .insert({ id: propertyId, ...patch, published: false });
      if (error)
        throw new Error(
          "Unable to create property. Check for a duplicate slug.",
        );
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Each photo must be under 10 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = imageType(bytes);
      if (!mime || file.type !== mime)
        throw new Error(
          "Only genuine JPEG, PNG and WebP images are supported.",
        );
      const ext =
        mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
      const path = `properties/${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage
        .from("property-images")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (error) throw new Error("Image upload failed. Check Storage setup.");
      uploaded.push(path);
      images.push(
        db.storage.from("property-images").getPublicUrl(path).data.publicUrl,
      );
    }
    if (images.length > 40)
      throw new Error("A listing supports at most 40 photos.");
    const { error } = await db
      .from("properties")
      .update({ ...patch, images })
      .eq("id", propertyId);
    if (error)
      throw new Error(
        "Unable to save property. Check the slug and field values.",
      );
    saved = true;
    if (remove.length) {
      const prefix = db.storage
        .from("property-images")
        .getPublicUrl(`properties/${propertyId}/`).data.publicUrl;
      const paths = remove
        .filter((url) => url.startsWith(prefix))
        .map((url) => `properties/${propertyId}/` + url.slice(prefix.length));
      if (paths.length) await db.storage.from("property-images").remove(paths);
    }
    refresh();
    return {
      success: "Property saved.",
      href: "/admin/properties/" + propertyId,
    };
  } catch (e) {
    if (!saved && uploaded.length)
      await db.storage.from("property-images").remove(uploaded);
    if (created && propertyId && !saved)
      await db.from("properties").delete().eq("id", propertyId);
    return fail(e);
  }
}
export async function deleteProperty(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  const { db } = await requireStaff();
  try {
    if (!checked(f, "confirm")) throw new Error("Confirm deletion first.");
    const propertyId = id(f);
    const { data: p } = await db
      .from("properties")
      .select("images")
      .eq("id", propertyId)
      .single();
    const { error } = await db.from("properties").delete().eq("id", propertyId);
    if (error) throw new Error("Unable to delete property");
    const prefix = db.storage
      .from("property-images")
      .getPublicUrl(`properties/${propertyId}/`).data.publicUrl;
    const paths =
      p?.images
        .filter((url) => url.startsWith(prefix))
        .map((url) => `properties/${propertyId}/` + url.slice(prefix.length)) ||
      [];
    if (paths.length) await db.storage.from("property-images").remove(paths);
    refresh();
    return { success: "Property deleted.", href: "/admin/properties" };
  } catch (e) {
    return fail(e);
  }
}
