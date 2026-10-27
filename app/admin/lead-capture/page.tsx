import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { settings } from "@/lib/settings";
import { AssistantCard, CaptureCard } from "@/components/admin/settings-cards";
export default async function CaptureSettings() {
  await requireStaff(true);
  const { capture, assistant } = await settings();
  return (
    <>
      <div className="ph">
        <div>
          <h1>Lead Capture Settings</h1>
          <p>
            Saved settings apply to the public website and its contact forms.
          </p>
        </div>
        <Link className="btn" href="/" target="_blank" rel="noopener">
          Open public site ↗
        </Link>
      </div>
      <div className="grid g22">
        <CaptureCard capture={capture} />
        <AssistantCard assistant={assistant} label="Save assistant settings" />
      </div>
    </>
  );
}
