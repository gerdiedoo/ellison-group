import "server-only";
import { privileged, configured } from "@/lib/supabase/server";
import { defaultSuggestedPrompts } from "@/lib/chat-prompts";
import {
  assistantSchema,
  captureSettingsSchema,
  companySchema,
} from "@/lib/validation";
export const defaultAssistant = {
  enabled: true,
  welcome: "Welcome to The Ellison Group. How can we help you find your place?",
  tone: "Warm, personal and unhurried",
  instructions:
    "Help visitors explore published homes and connect with our team.",
  handoffEnabled: true,
  prompts: defaultSuggestedPrompts,
};
export const defaultCapture = {
  headline: "Find your place with us.",
  description: "Tell us a little about yourself so our team can help.",
  phoneRequired: true,
  phoneLabel: "Phone number",
  messageLabel: "Message",
  googleEnabled: false,
};
export const defaultCompany = {
  name: "The Ellison Group",
  phone: "(501) 725-1227",
  address: "12814 Cantrell Rd, Little Rock, AR 72223",
  email: "",
  instagram: "https://www.instagram.com/theellisongroup",
};
export async function settings() {
  if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return {
      company: defaultCompany,
      assistant: defaultAssistant,
      capture: {
        ...defaultCapture,
        googleConfigured: process.env.GOOGLE_OAUTH_ENABLED === "true",
      },
    };
  const { data, error } = await privileged().from("settings").select("*");
  if (error) throw new Error("Unable to load application settings.");
  const value = (key: string) => data.find((s) => s.key === key)?.value;
  return {
    company: companySchema.parse(value("company")),
    assistant: assistantSchema.parse(value("assistant")),
    capture: {
      ...captureSettingsSchema.parse(value("capture")),
      googleConfigured: process.env.GOOGLE_OAUTH_ENABLED === "true",
    },
  };
}
