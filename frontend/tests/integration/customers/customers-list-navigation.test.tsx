import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import CustomersPage from "@/app/(dashboard)/masters/customers/page";

const existingCustomer = {
  id: 1,
  customer_code: "CUS0001",
  customer_name: "Acme Co",
  contact_person: null,
  mobile: null,
  phone: null,
  email: null,
  website: null,
  tax_registration_no: null,
  customer_type: "Company",
  opening_balance: "100.00",
  balance_type: "Debit",
  credit_limit: null,
  payment_terms: null,
  currency: "AED",
  status: "Active",
  notes: null,
  created_at: "2026-07-14T00:00:00Z",
  updated_at: "2026-07-14T00:00:00Z",
};

describe("Customers list page navigation", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ items: [existingCustomer], total: 1, page: 1, page_size: 25 }),
        })
      )
    );
  });

  it("renders 'New Customer' as a link to the dedicated create page, not a popup trigger", async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByText("CUS0001")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /new customer/i });
    expect(link).toHaveAttribute("href", "/masters/customers/new");
  });

  it("navigates to the dedicated edit page when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByText("CUS0001")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(pushMock).toHaveBeenCalledWith("/masters/customers/1/edit");
  });
});
