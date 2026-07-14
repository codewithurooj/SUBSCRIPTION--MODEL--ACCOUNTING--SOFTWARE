import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { Sidebar } from "@/components/sidebar/Sidebar";

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders exactly four group headers in order: Masters, Inputs, Registers, Reports", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const headers = within(nav).getAllByRole("button");
    expect(headers.map((button) => button.textContent?.replace(/[+−]/g, ""))).toEqual([
      "Masters",
      "Inputs",
      "Registers",
      "Reports",
    ]);
  });

  it("renders all four groups collapsed by default when no route matches", () => {
    render(<Sidebar />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("expanding one group does not collapse another already-expanded group", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Masters" }));
    expect(screen.getByRole("link", { name: "Customers" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Inputs" }));
    expect(screen.getByRole("link", { name: "Customers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sales" })).toBeInTheDocument();
  });

  it("collapses only the group whose header is clicked again", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: "Masters" }));
    await user.click(screen.getByRole("button", { name: "Inputs" }));
    await user.click(screen.getByRole("button", { name: "Masters" }));

    expect(screen.queryByRole("link", { name: "Customers" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sales" })).toBeInTheDocument();
  });

  it("auto-expands the parent group of the current route on initial render, leaving others collapsed", () => {
    vi.mocked(usePathname).mockReturnValue("/reports/trial-balance");
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: "Trial Balance" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Customers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sales" })).not.toBeInTheDocument();
  });

  it("marks no item active when the pathname matches no nav route", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Sidebar />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders a visible menu toggle button and a closed mobile panel by default", () => {
    render(<Sidebar />);

    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toHaveAttribute("data-mobile-open", "false");
  });
});
