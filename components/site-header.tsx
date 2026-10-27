"use client";
import { useRef } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Menu } from "lucide-react";
const links = [
  ["/properties", "Homes"],
  ["/neighborhoods", "Neighborhoods"],
  ["/about", "Kerry & Team"],
  ["/#stories", "Client stories"],
  ["/home-valuation", "Sell with us"],
  ["/favorites", "Favorites"],
];
export function SiteHeader({
  name,
  signedIn = false,
}: {
  name: string;
  signedIn?: boolean;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site">
        <div className="nav">
          <Link className="logo" href="/">
            {name}
            <small>Little Rock</small>
          </Link>
          <ul>
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
          <div className="right">
            {signedIn ? (
              <form action={signOut}>
                <SubmitButton
                  className="signin-link"
                  pendingLabel="Signing out…"
                >
                  Sign out
                </SubmitButton>
              </form>
            ) : (
              <Link className="signin-link" href="/login?next=/favorites">
                Sign in
              </Link>
            )}
            <Link className="btn" href="/contact">
              Talk with us
            </Link>
            <details
              className="mobile-menu"
              ref={menu}
              onKeyDown={(e) => {
                if (e.key === "Escape" && menu.current)
                  menu.current.open = false;
              }}
            >
              <summary aria-label="Menu">
                <Menu />
              </summary>
              <nav
                aria-label="Mobile"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a") && menu.current)
                    menu.current.open = false;
                }}
              >
                {links.map(([href, label]) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))}
                <Link href="/contact">Contact</Link>
              </nav>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
