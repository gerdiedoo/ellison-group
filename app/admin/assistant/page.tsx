import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { ActionForm } from "@/components/action-form";
import { Field, Area, Check } from "@/lib/admin-fields";
import { saveSettings } from "@/app/actions/crm";
export default async function AssistantSettings() {
  await requireStaff(true);
  const { assistant: a } = await settings();
  return (
    <>
      <h1>AI Assistant</h1>
      <p>
        Gemini interprets visitor requests and selects published records. The
        server renders verified property facts. API credentials are managed
        through environment configuration.
      </p>
      <div className="card">
        <ActionForm action={saveSettings}>
          <input type="hidden" name="key" value="assistant" />
          <Check
            name="enabled"
            label="Enable public chatbot"
            checked={a.enabled}
          />
          <Area name="welcome" label="Welcome message" value={a.welcome} />
          <Field name="tone" label="Tone preference" value={a.tone} />
          <Area
            name="instructions"
            label="Assistant instructions (cannot override factual constraints)"
            value={a.instructions}
          />
          <Check
            name="handoffEnabled"
            label="Allow visitor requests for human handoff"
            checked={a.handoffEnabled}
          />
        </ActionForm>
      </div>
    </>
  );
}
