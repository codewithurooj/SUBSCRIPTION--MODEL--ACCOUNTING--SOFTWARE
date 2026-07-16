"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_CONFIG } from "./nav-config";
import { NavGroup } from "./NavGroup";
import { MobileNavToggle } from "./MobileNavToggle";

function deriveInitialExpandedState(pathname: string | null) {
  return Object.fromEntries(
    NAV_CONFIG.map((group) => [
      group.slug,
      group.items.some((item) => item.href === pathname),
    ]),
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => deriveInitialExpandedState(pathname),
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsMobileOpen(false);
  }

  function toggleGroup(slug: string) {
    setExpandedGroups((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  return (
    <>
      <MobileNavToggle
        isOpen={isMobileOpen}
        onToggle={() => setIsMobileOpen((open) => !open)}
        onClose={() => setIsMobileOpen(false)}
      />
      <nav
        id="mobile-sidebar-panel"
        aria-label="Main navigation"
        data-mobile-open={isMobileOpen}
        className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-ink-950 text-paper-text transition-transform duration-200 ease-in-out md:static md:z-auto md:w-64 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-5">
          <span className="inline-block h-6 w-1.5 rounded-sm bg-gold-500" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide text-paper-text uppercase">
            Subscription Accounting
          </span>
        </div>
        <ul>
          {NAV_CONFIG.map((group) => (
            <NavGroup
              key={group.slug}
              group={group}
              isExpanded={expandedGroups[group.slug]}
              onToggle={() => toggleGroup(group.slug)}
            />
          ))}
        </ul>
      </nav>
    </>
  );
}
