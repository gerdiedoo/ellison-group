import { InquiryForm } from "@/components/inquiry-form";
import { settings } from "@/lib/settings";
export default async function Newsletter() {
  const { capture } = await settings();
  return (
    <div className="wrap page" style={{ maxWidth: 700 }}>
      <h1>
        The Market <em>Review.</em>
      </h1>
      <p>
        Leave your details to request market updates from our team. This creates
        a subscription request for staff review.
      </p>
      <InquiryForm kind="Newsletter" config={capture} />
    </div>
  );
}
