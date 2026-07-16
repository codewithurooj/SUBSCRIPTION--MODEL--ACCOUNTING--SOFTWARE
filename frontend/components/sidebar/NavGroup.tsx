"use client";

import { NavItem } from "./NavItem";
import type { NavigationGroup } from "./nav-config";

interface NavGroupProps {
  group: NavigationGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export function NavGroup({ group, isExpanded, onToggle }: NavGroupProps) {
  const listId = `nav-group-${group.slug}`;

  return (
    <li className="border-b border-ink-800">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={listId}
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold tracking-wide text-paper-text/90 uppercase hover:bg-ink-900"
      >
        {group.label}
        <span aria-hidden="true" className="text-gold-500">
          {isExpanded ? "−" : "+"}
        </span>
      </button>
      {isExpanded && (
        <ul id={listId} className="space-y-0.5 pb-2">
          {group.items.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </ul>
      )}
    </li>
  );
}
