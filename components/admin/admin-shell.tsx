"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  SourceOverview,
  SourceLeads,
  SourceProperties,
  SourceConversations,
  SourceAssistant,
  SourceCapture,
  SourceActivity,
  SourceSettings,
} from "@/components/admin/source-icons";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import {
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/database.types";

const mainLinks: {
  slug: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  admin?: boolean;
}[] = [
  { slug: "", label: "Overview", icon: SourceOverview },
  { slug: "leads", label: "Leads", icon: SourceLeads },
  { slug: "properties", label: "Properties", icon: SourceProperties },
  { slug: "conversations", label: "Conversations", icon: SourceConversations },
  {
    slug: "assistant",
    label: "AI Assistant",
    icon: SourceAssistant,
    admin: true,
  },
  {
    slug: "lead-capture",
    label: "Lead Capture Settings",
    icon: SourceCapture,
    admin: true,
  },
  { slug: "activity", label: "Activity Log", icon: SourceActivity },
  { slug: "settings", label: "Settings", icon: SourceSettings, admin: true },
];
const extensions = [
  { slug: "inquiries", label: "Inquiries", icon: FileText },
  { slug: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { slug: "team", label: "Team Management", icon: UsersRound, admin: true },
];

let collapsedFallback = false;
function subscribeCollapse(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("eg-admin-layout", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("eg-admin-layout", notify);
  };
}
function readCollapse() {
  try {
    return localStorage.getItem("eg_admin_collapsed") === "1";
  } catch {
    return collapsedFallback;
  }
}
function subscribeMobile(notify: () => void) {
  const media = window.matchMedia("(max-width: 900px)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const readMobile = () => window.matchMedia("(max-width: 900px)").matches;
const serverSnapshot = () => false;
function SignOutItem() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" role="menuitem" disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function AdminShell({
  profile,
  email,
  badges,
  children,
}: {
  profile: Profile;
  email: string;
  badges: { leads: number; conversations: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeCollapse,
    readCollapse,
    serverSnapshot,
  );
  const mobile = useSyncExternalStore(
    subscribeMobile,
    readMobile,
    serverSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const side = useRef<HTMLElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const profileRoot = useRef<HTMLDivElement>(null);
  const profileButton = useRef<HTMLButtonElement>(null);
  const name = profile.full_name.trim() || "Staff member";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    function clickAway(event: MouseEvent) {
      if (!profileRoot.current?.contains(event.target as Node))
        setProfileOpen(false);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (mobileOpen) burger.current?.focus();
        else if (profileOpen) profileButton.current?.focus();
        setMobileOpen(false);
        setProfileOpen(false);
      }
      if (event.key === "Tab" && mobile && mobileOpen && side.current) {
        const nodes = [
          ...side.current.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled])",
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    function closeOnHistory() {
      setMobileOpen(false);
      setProfileOpen(false);
    }
    document.addEventListener("click", clickAway);
    document.addEventListener("keydown", keydown);
    window.addEventListener("popstate", closeOnHistory);
    return () => {
      document.removeEventListener("click", clickAway);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("popstate", closeOnHistory);
    };
  }, [mobile, mobileOpen, profileOpen]);

  useEffect(() => {
    if (!mobile || !mobileOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    side.current?.querySelector<HTMLElement>("a[href]")?.focus();
    return () => {
      document.body.style.overflow = before;
    };
  }, [mobile, mobileOpen]);

  function toggleCollapse() {
    const next = !collapsed;
    collapsedFallback = next;
    try {
      localStorage.setItem("eg_admin_collapsed", next ? "1" : "0");
    } catch {
      /* The UI still works when storage is unavailable. */
    }
    window.dispatchEvent(new Event("eg-admin-layout"));
  }
  function navigationLink({
    slug,
    label,
    icon: Icon,
    admin,
  }: (typeof mainLinks)[number]) {
    if (admin && profile.role !== "admin") return null;
    const href = "/admin" + (slug ? "/" + slug : "");
    const active = slug
      ? pathname === href || pathname.startsWith(href + "/")
      : pathname === "/admin";
    const badge =
      slug === "leads"
        ? badges.leads
        : slug === "conversations"
          ? badges.conversations
          : 0;
    return (
      <Link
        key={slug}
        href={href}
        aria-current={active ? "page" : undefined}
        title={label}
        onClick={() => setMobileOpen(false)}
      >
        <Icon aria-hidden="true" />
        <span className="lb">{label}</span>
        {badge > 0 && (
          <span className="bd" aria-label={`${badge} need attention`}>
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="crm">
      <a className="skip" href="#page">
        Skip to content
      </a>
      <div
        className={`app${collapsed ? " collapsed" : ""}${mobileOpen ? " mopen" : ""}`}
        id="app"
      >
        <aside
          className="side"
          id="side"
          ref={side}
          aria-label="Admin navigation"
          inert={mobile && !mobileOpen}
        >
          <div className="brand">
            <i aria-hidden="true">E</i>
            <span>
              The Ellison Group<small>Admin · CRM</small>
            </span>
          </div>
          <nav className="nav" aria-label="CRM">
            {mainLinks.map(navigationLink)}
            <div className="extensions" aria-hidden="true">
              Workspace
            </div>
            {extensions.map(navigationLink)}
          </nav>
          <div className="sfoot">
            <Link href="/" title="Open public site">
              <ExternalLink aria-hidden="true" />
              <span>Open public site</span>
            </Link>
            <button
              type="button"
              onClick={() => (mobile ? setMobileOpen(false) : toggleCollapse())}
              aria-label={
                mobile
                  ? "Close navigation"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
            >
              {mobile ? (
                <X aria-hidden="true" />
              ) : collapsed ? (
                <ChevronRight aria-hidden="true" />
              ) : (
                <ChevronLeft aria-hidden="true" />
              )}
              <span>
                {mobile
                  ? "Close navigation"
                  : collapsed
                    ? "Expand"
                    : "Collapse"}
              </span>
            </button>
          </div>
        </aside>
        <div
          className="mscrim"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
        <div className="main">
          <header className="top">
            <button
              className="burger"
              ref={burger}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-controls="side"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span className="demo">ADMIN WORKSPACE</span>
            <span className="sp" />
            <Link className="pub" href="/">
              View public site →
            </Link>
            <div className="prof" ref={profileRoot}>
              <button
                ref={profileButton}
                aria-haspopup="menu"
                aria-controls="profile-menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="av">{initials}</span>
                <span className="name">{name.split(/\s+/)[0]}</span>
              </button>
              {profileOpen && (
                <div
                  className="menu on"
                  id="profile-menu"
                  role="menu"
                  aria-label="Your account"
                >
                  <div className="hd">
                    <b>{name}</b>
                    <span className="role">{profile.role}</span>
                    <small>{email}</small>
                  </div>
                  <div className="lab">Your workspace</div>
                  {profile.role === "admin" && (
                    <Link
                      href="/admin/team"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Team Management
                    </Link>
                  )}
                  <Link href="/" role="menuitem">
                    Open public site
                  </Link>
                  <form action={signOut}>
                    <SignOutItem />
                  </form>
                </div>
              )}
            </div>
          </header>
          <main className="page" id="page" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
