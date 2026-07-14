import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNavToggle } from "@/components/sidebar/MobileNavToggle";

describe("MobileNavToggle", () => {
  it("renders a toggle button reflecting the closed state", () => {
    render(<MobileNavToggle isOpen={false} onToggle={() => {}} onClose={() => {}} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("does not render a backdrop when closed", () => {
    render(<MobileNavToggle isOpen={false} onToggle={() => {}} onClose={() => {}} />);
    expect(screen.queryByTestId("mobile-nav-backdrop")).not.toBeInTheDocument();
  });

  it("renders a backdrop when open, and closing it calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MobileNavToggle isOpen={true} onToggle={() => {}} onClose={onClose} />);

    const backdrop = screen.getByTestId("mobile-nav-backdrop");
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when the button is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<MobileNavToggle isOpen={false} onToggle={onToggle} onClose={() => {}} />);

    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
