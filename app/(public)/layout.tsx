import { configured, supabase } from "@/lib/supabase/server";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ChatWidget } from "@/components/chat-widget";
import { settings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, assistant, capture } = await settings();
  const user = configured()
    ? (await (await supabase()).auth.getUser()).data.user
    : null;
  return (
    <>
      <SiteHeader name={company.name} signedIn={!!user} />
      <main id="main">{children}</main>
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <span className="flogo">{company.name}</span>
              <p>{company.address}</p>
              <p>{company.phone}</p>
              {company.email && (
                <a href={"mailto:" + company.email}>{company.email}</a>
              )}
            </div>
            <div>
              <h5>Explore</h5>
              <ul>
                <li>
                  <Link href="/properties">All listings</Link>
                </li>
                <li>
                  <Link href="/neighborhoods">Neighborhoods</Link>
                </li>
                <li>
                  <Link href="/favorites">Favorites</Link>
                </li>
                <li>
                  <Link href="/#journal">Journal</Link>
                </li>
              </ul>
            </div>
            <div>
              <h5>Work with us</h5>
              <ul>
                <li>
                  <Link href="/about">Kerry & team</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
                <li>
                  <Link href="/home-valuation">Home valuation</Link>
                </li>
                <li>
                  <Link href="/admin">Staff CRM</Link>
                </li>
              </ul>
            </div>
            <div>
              <h5>Information</h5>
              <ul>
                <li>
                  <Link href="/privacy">Privacy policy</Link>
                </li>
                <li>
                  <Link href="/terms">Terms & conditions</Link>
                </li>
                {company.instagram && (
                  <li>
                    <a href={company.instagram}>Instagram</a>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="legal">
            <span>
              Keller Williams Realty and The Ellison Group. Each office is
              independently owned and operated. REALTOR® · Equal Housing
              Opportunity.
            </span>
            <span>
              Illustrations are conceptual and do not depict actual properties.
            </span>
          </div>
        </div>
      </footer>
      <ChatWidget
        enabled={assistant.enabled}
        welcome={assistant.welcome}
        handoffEnabled={assistant.handoffEnabled}
        capture={capture}
      />
    </>
  );
}
