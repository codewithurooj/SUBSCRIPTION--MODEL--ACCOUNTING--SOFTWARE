"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "./nav-config";

interface NavItemProps {
  item: NavigationItem;
}

export function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <li>
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={
          isActive
            ? "block border-l-2 border-gold-500 bg-ink-900 px-4 py-1.5 pl-[1.875rem] text-sm font-semibold text-gold-400"
            : "block border-l-2 border-transparent px-4 py-1.5 pl-[1.875rem] text-sm text-paper-text/70 hover:border-ink-700 hover:bg-ink-900 hover:text-paper-text"
        }
      >
        {item.label}
      </Link>
    </li>
  );
}
