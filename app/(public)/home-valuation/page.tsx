import { queryValues } from "@/lib/validation";
import { InquiryForm } from "@/components/inquiry-form";
import { settings } from "@/lib/settings";
export const metadata = { title: "Home valuation" };
export default async function Valuation({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const initialAddress = (queryValues(await searchParams).address || "").slice(
    0,
    300,
  );
  const { capture } = await settings();
  return (
    <div className="wrap page two-cols">
      <div>
        <span className="eyebrow">For sellers</span>
        <h1>
          What is your home <em>really</em> worth?
        </h1>
        <p>
          Automated estimates are a starting point at best. Tell us about your
          home and Kerry’s team will prepare a considered valuation by hand.
        </p>
        <ul className="vlist">
          <li>Reviewed personally by an experienced agent</li>
          <li>No obligation, no pressure</li>
        </ul>
      </div>
      <div className="card">
        <InquiryForm
          valuation
          initialAddress={initialAddress}
          kind="Valuation request"
          config={capture}
        />
      </div>
    </div>
  );
}
