import { InquiryForm } from "@/components/inquiry-form";
import { settings } from "@/lib/settings";
export const metadata = { title: "Contact" };
export default async function Contact() {
  const { capture, company } = await settings();
  return (
    <div className="wrap page two-cols">
      <div>
        <span className="eyebrow">Your journey starts here</span>
        <h1>
          Let’s find <em>your place.</em>
        </h1>
        <p>
          Market expertise, steady negotiation and a client-first approach.
          Whether you’re buying or selling in the Little Rock area, we’ll guide
          you with clarity.
        </p>
        <p>{company.address}</p>
        <a
          className="link"
          href={"tel:" + company.phone.replace(/[^+0-9]/g, "")}
        >
          {company.phone}
        </a>
      </div>
      <div className="card">
        <InquiryForm config={capture} />
      </div>
    </div>
  );
}
