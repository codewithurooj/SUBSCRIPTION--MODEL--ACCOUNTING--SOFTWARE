import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { NavGroup } from "@/components/sidebar/NavGroup";
import type { NavigationGroup } from "@/components/sidebar/nav-config";

const group: NavigationGroup = {
  label: "Masters",
  slug: "masters",
  order: 0,
  items: [
    { label: "Customers", slug: "customers", href: "/masters/customers", order: 0 },
    { label: "Vendors", slug: "vendors", href: "/masters/vendors", order: 1 },
    {
      label: "Chart of Accounts",
      slug: "chart-of-accounts",
      href: "/masters/chart-of-accounts",
      order: 2,
    },
  ],
};

describe("NavGroup", () => {
  it("does not render sub-items when collapsed", () => {
    render(
      <ul>
        <NavGroup group={group} isExpanded={false} onToggle={() => {}} />
      </ul>,
    );
    expect(screen.queryByRole("link", { name: "Customers" })).not.toBeInTheDocument();
  });

  it("renders sub-items in the specified order when expanded", () => {
    render(
      <ul>
        <NavGroup group={group} isExpanded={true} onToggle={() => {}} />
      </ul>,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Customers",
      "Vendors",
      "Chart of Accounts",
    ]);
  });

  it("calls onToggle when the group header is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <ul>
        <NavGroup group={group} isExpanded={false} onToggle={onToggle} />
      </ul>,
    );
    await user.click(screen.getByRole("button", { name: "Masters" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
