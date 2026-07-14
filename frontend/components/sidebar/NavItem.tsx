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
            ? "block px-4 py-1.5 pl-8 text-sm font-semibold text-blue-600"
            : "block px-4 py-1.5 pl-8 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }
      >
        {item.label}
      </Link>
    </li>
  );
}
