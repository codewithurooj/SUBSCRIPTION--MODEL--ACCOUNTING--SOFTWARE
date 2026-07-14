import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { NavItem } from "@/components/sidebar/NavItem";
import type { NavigationItem } from "@/components/sidebar/nav-config";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const inputsSales: NavigationItem = {
  label: "Sales",
  slug: "sales",
  href: "/inputs/sales",
  order: 0,
};

const registersSales: NavigationItem = {
  label: "Sales",
  slug: "sales",
  href: "/registers/sales",
  order: 0,
};

describe("NavItem", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders as a link with the correct href and label text", () => {
    render(
      <ul>
        <NavItem item={inputsSales} />
      </ul>,
    );
    const link = screen.getByRole("link", { name: "Sales" });
    expect(link).toHaveAttribute("href", "/inputs/sales");
  });

  it("marks itself active only when its own href matches the current pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/inputs/sales");

    render(
      <ul>
        <NavItem item={inputsSales} />
        <NavItem item={registersSales} />
      </ul>,
    );

    const links = screen.getAllByRole("link", { name: "Sales" });
    const [inputsLink, registersLink] = links;

    expect(inputsLink).toHaveAttribute("aria-current", "page");
    expect(registersLink).not.toHaveAttribute("aria-current");
  });

  it("marks no item active when the pathname matches neither", () => {
    vi.mocked(usePathname).mockReturnValue("/reports/ledger");

    render(
      <ul>
        <NavItem item={inputsSales} />
        <NavItem item={registersSales} />
      </ul>,
    );

    for (const link of screen.getAllByRole("link", { name: "Sales" })) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});
