"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
const links = [
  ["/properties", "Homes"],
  ["/neighborhoods", "Neighborhoods"],
  ["/about", "Kerry & Team"],
  ["/#stories", "Client stories"],
  ["/home-valuation", "Sell with us"],
  ["/#journal", "Journal"],
];
const subscribeToScroll = (notify: () => void) => {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
};
export function SiteHeader({
  name,
  phone = "(501) 725-1227",
  signedIn = false,
}: {
  name: string;
  phone?: string;
  signedIn?: boolean;
}) {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 30,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const account = useRef<HTMLDetailsElement>(null);
  const home = pathname === "/";
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key !== "Tab") return;
      const nodes = [
        trigger.current,
        ...Array.from(
          drawer.current?.querySelectorAll<HTMLElement>("a, button") || [],
        ),
      ].filter(
        (node): node is HTMLElement => !!node && !node.hasAttribute("disabled"),
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    function resized() {
      if (window.innerWidth > 1150) setOpen(false);
    }
    window.addEventListener("resize", resized);
    window.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", resized);
      window.removeEventListener("keydown", keyboard);
    };
  }, [open]);
  return (
    <div className={"public-navigation" + (open ? " menu-open" : "")}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header
        className={
          "site" +
          (home ? " home-header" : "") +
          (!home || scrolled ? " solid" : "")
        }
      >
        <div className="nav">
          <Link className="logo" href="/" onClick={() => setOpen(false)}>
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
            {phone && (
              <a className="tel" href={"tel:" + phone.replace(/[^+\d]/g, "")}>
                {phone}
              </a>
            )}
            <Link className="btn" href="/contact">
              Talk with us
            </Link>
            <details
              className="account-menu"
              ref={account}
              onKeyDown={(event) => {
                if (event.key === "Escape" && account.current) {
                  account.current.open = false;
                  account.current
                    .querySelector<HTMLElement>("summary")
                    ?.focus();
                }
              }}
            >
              <summary aria-label="Your account">
                <UserRound size={19} />
              </summary>
              <div
                className="account-links"
                onClick={(event) => {
                  if (
                    (event.target as HTMLElement).closest("a") &&
                    account.current
                  )
                    account.current.open = false;
                }}
              >
                <Link href="/favorites">Favorites</Link>
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
                  <Link href="/login?next=/favorites">Sign in</Link>
                )}
              </div>
            </details>
            <button
              ref={trigger}
              type="button"
              className="burger"
              aria-label={open ? "Close menu" : "Menu"}
              aria-expanded={open}
              aria-controls="public-mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              <span />
            </button>
          </div>
        </div>
      </header>
      <nav
        ref={drawer}
        id="public-mobile-navigation"
        className="drawer"
        aria-label="Mobile"
        aria-hidden={!open}
        inert={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) close();
        }}
      >
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
        <div className="drawer-utilities">
          <Link href="/favorites">Favorites</Link>
          {signedIn ? (
            <form action={signOut}>
              <SubmitButton className="signin-link" pendingLabel="Signing out…">
                Sign out
              </SubmitButton>
            </form>
          ) : (
            <Link href="/login?next=/favorites">Sign in</Link>
          )}
          <Link href="/contact">Contact</Link>
        </div>
      </nav>
    </div>
  );
}
