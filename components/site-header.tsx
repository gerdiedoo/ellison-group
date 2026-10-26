import Link from "next/link";
import { Menu } from "lucide-react";
const links = [
  ["/properties", "Homes"],
  ["/neighborhoods", "Neighborhoods"],
  ["/about", "Kerry & Team"],
  ["/#stories", "Client stories"],
  ["/home-valuation", "Sell with us"],
  ["/favorites", "Favorites"],
];
export function SiteHeader({ name }: { name: string }) {
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
            <Link className="btn" href="/contact">
              Talk with us
            </Link>
            <details className="mobile-menu">
              <summary aria-label="Menu">
                <Menu />
              </summary>
              <nav aria-label="Mobile">
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
