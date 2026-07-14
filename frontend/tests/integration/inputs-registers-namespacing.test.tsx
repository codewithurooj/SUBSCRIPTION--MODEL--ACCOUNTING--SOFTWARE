import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NAV_CONFIG } from "@/components/sidebar/nav-config";
import { PlaceholderPage } from "@/components/placeholder/PlaceholderPage";

const SHARED_LABELS = [
  "Sales",
  "Purchase",
  "Receipt",
  "Payment",
  "Petty Cash",
  "Journal",
];

describe("Inputs vs Registers route namespacing", () => {
  const inputs = NAV_CONFIG.find((group) => group.slug === "inputs")!;
  const registers = NAV_CONFIG.find((group) => group.slug === "registers")!;

  it.each(SHARED_LABELS)(
    "renders distinguishable content for '%s' under Inputs vs Registers",
    (label) => {
      const inputItem = inputs.items.find((item) => item.label === label)!;
      const registerItem = registers.items.find(
        (item) => item.label === label,
      )!;

      expect(inputItem.href).not.toBe(registerItem.href);

      const { unmount } = render(
        <PlaceholderPage group={inputs.label} title={inputItem.label} />,
      );
      const inputsContent = screen.getByTestId("placeholder-heading").textContent;
      unmount();

      render(
        <PlaceholderPage group={registers.label} title={registerItem.label} />,
      );
      const registersContent = screen.getByTestId(
        "placeholder-heading",
      ).textContent;

      expect(inputsContent).not.toBe(registersContent);
    },
  );
});
