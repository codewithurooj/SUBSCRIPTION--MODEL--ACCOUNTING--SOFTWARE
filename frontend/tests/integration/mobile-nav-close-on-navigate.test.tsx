import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { Sidebar } from "@/components/sidebar/Sidebar";

describe("Mobile nav closes automatically on navigation", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("closes the mobile panel when the pathname changes after being opened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Sidebar />);

    await user.click(screen.getByRole("button", { name: /menu/i }));
    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toHaveAttribute("data-mobile-open", "true");

    vi.mocked(usePathname).mockReturnValue("/masters/customers");
    rerender(<Sidebar />);

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toHaveAttribute("data-mobile-open", "false");
  });
});
