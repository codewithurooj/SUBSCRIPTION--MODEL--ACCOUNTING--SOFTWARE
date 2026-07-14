export interface NavigationItem {
  label: string;
  slug: string;
  href: string;
  order: number;
}

export interface NavigationGroup {
  label: string;
  slug: string;
  order: number;
  items: NavigationItem[];
}

function makeItems(groupSlug: string, labels: string[]): NavigationItem[] {
  return labels.map((label, index) => {
    const slug = label
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      label,
      slug,
      href: `/${groupSlug}/${slug}`,
      order: index,
    };
  });
}

export const NAV_CONFIG: NavigationGroup[] = [
  {
    label: "Masters",
    slug: "masters",
    order: 0,
    items: makeItems("masters", ["Customers", "Vendors", "Chart of Accounts"]),
  },
  {
    label: "Inputs",
    slug: "inputs",
    order: 1,
    items: makeItems("inputs", [
      "Sales",
      "Purchase",
      "Receipt",
      "Payment",
      "Petty Cash",
      "Journal",
    ]),
  },
  {
    label: "Registers",
    slug: "registers",
    order: 2,
    items: makeItems("registers", [
      "Sales",
      "Purchase",
      "Receipt",
      "Payment",
      "Petty Cash",
      "Journal",
    ]),
  },
  {
    label: "Reports",
    slug: "reports",
    order: 3,
    items: makeItems("reports", [
      "Ledger",
      "Ageing",
      "Trial Balance",
      "Profit & Loss",
      "Balance Sheet",
    ]),
  },
];
