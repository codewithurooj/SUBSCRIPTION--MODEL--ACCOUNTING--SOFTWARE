import { describe, expect, it } from "vitest";
import { NAV_CONFIG } from "@/components/sidebar/nav-config";

describe("NAV_CONFIG", () => {
  it("has exactly 4 groups in the fixed order Masters, Inputs, Registers, Reports", () => {
    expect(NAV_CONFIG.map((group) => group.label)).toEqual([
      "Masters",
      "Inputs",
      "Registers",
      "Reports",
    ]);
  });

  it("has exactly 20 total sub-items across all groups", () => {
    const totalItems = NAV_CONFIG.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );
    expect(totalItems).toBe(20);
  });

  it("has a globally unique href for every sub-item, even across identically-labeled items", () => {
    const allHrefs = NAV_CONFIG.flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(new Set(allHrefs).size).toBe(allHrefs.length);
  });

  it("namespaces the six shared Inputs/Registers labels under distinct routes", () => {
    const inputs = NAV_CONFIG.find((group) => group.slug === "inputs")!;
    const registers = NAV_CONFIG.find((group) => group.slug === "registers")!;
    const sharedLabels = [
      "Sales",
      "Purchase",
      "Receipt",
      "Payment",
      "Petty Cash",
      "Journal",
    ];

    for (const label of sharedLabels) {
      const inputItem = inputs.items.find((item) => item.label === label);
      const registerItem = registers.items.find(
        (item) => item.label === label,
      );
      expect(inputItem).toBeDefined();
      expect(registerItem).toBeDefined();
      expect(inputItem!.href).not.toBe(registerItem!.href);
    }
  });
});
