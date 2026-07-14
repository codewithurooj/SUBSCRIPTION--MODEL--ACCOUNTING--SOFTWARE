import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import DashboardLayout from "@/app/(dashboard)/layout";

describe("Deep link / refresh auto-expand (quickstart.md step 5)", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/reports/trial-balance");
  });

  it("renders the Reports group expanded with Trial Balance active on a simulated direct navigation to its route", () => {
    render(
      <DashboardLayout>
        <div>Trial Balance page content</div>
      </DashboardLayout>,
    );

    const trialBalanceLink = screen.getByRole("link", { name: "Trial Balance" });
    expect(trialBalanceLink).toBeInTheDocument();
    expect(trialBalanceLink).toHaveAttribute("aria-current", "page");

    expect(screen.queryByRole("link", { name: "Customers" })).not.toBeInTheDocument();
    expect(screen.getByText("Trial Balance page content")).toBeInTheDocument();
  });
});
