import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlaceholderPage } from "@/components/placeholder/PlaceholderPage";

describe("PlaceholderPage", () => {
  it("renders the given group label and item title", () => {
    render(<PlaceholderPage group="Inputs" title="Sales" />);
    expect(screen.getAllByText(/Inputs/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Sales/).length).toBeGreaterThan(0);
  });

  it("renders a 'not yet built' indicator", () => {
    render(<PlaceholderPage group="Masters" title="Customers" />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("renders distinguishable content for the same title under different groups", () => {
    const { unmount } = render(
      <PlaceholderPage group="Inputs" title="Sales" />,
    );
    const inputsText = screen.getByTestId("placeholder-heading").textContent;
    unmount();

    render(<PlaceholderPage group="Registers" title="Sales" />);
    const registersText = screen.getByTestId("placeholder-heading").textContent;

    expect(inputsText).not.toBe(registersText);
  });
});
