import { settings } from "@/lib/settings";
import Link from "next/link";
export const metadata = { title: "Privacy policy" };
export default async function Privacy() {
  const { company } = await settings();
  return (
    <article className="wrap page legal-copy">
      <h1>Privacy policy.</h1>
      <p>
        Effective October 26, 2026. This policy describes how this website
        handles the information you provide to The Ellison Group.
      </p>
      <h2>Information we collect</h2>
      <p>
        Inquiry forms collect your name, email, phone number when required,
        consent, message and relevant property or valuation details. The
        assistant stores chat messages and any contact details you choose to
        share. Signed-in visitors may save favorites. We record administrative
        activity and limited, hashed identifiers for abuse protection.
      </p>
      <h2>How we use it</h2>
      <p>
        We use this information to respond to requests, arrange follow-up,
        manage relationships and operate the website. A showing request is not a
        confirmed booking. Newsletter requests are reviewed by the team.
      </p>
      <h2>Service providers</h2>
      <p>
        Supabase provides database, authentication and storage services. Google
        provides optional sign-in and Gemini assistant processing. Chat content
        and relevant public property records may be processed by Gemini; avoid
        sharing sensitive financial or identity information in chat. Contact
        details submitted through the dedicated form are stored in the CRM.
      </p>
      <h2>Cookies and choices</h2>
      <p>
        Necessary cookies maintain authentication and associate your browser
        with its private chat history for up to 30 days. Clearing cookies
        removes your access to that browser’s conversation. We do not use
        advertising cookies in this application.
      </p>
      <h2>Access and retention</h2>
      <p>
        Authorized staff may access inquiry records to follow up. We retain
        records while needed for that purpose and applicable recordkeeping
        obligations. Contact us to request access, correction or deletion, or to
        withdraw permission for future contact.
      </p>
      <h2>Contact</h2>
      <p>
        Call {company.phone} or use our{" "}
        <Link className="link" href="/contact">
          contact form
        </Link>{" "}
        for privacy requests.
      </p>
    </article>
  );
}
