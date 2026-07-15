import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomersPage from "@/app/(dashboard)/masters/customers/page";

const createdCustomer = {
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

describe("Creating a customer end-to-end through the page", () => {
  beforeEach(() => {
    let customerCreated = false;

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          customerCreated = true;
          return Promise.resolve({ ok: true, json: async () => createdCustomer });
        }
        // GET list — empty before creation, one row after.
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: customerCreated ? [createdCustomer] : [],
            total: customerCreated ? 1 : 0,
            page: 1,
            page_size: 25,
          }),
        });
      })
    );
  });

  it("submitting a valid create form adds the new customer to the table via the BFF route", async () => {
    const user = userEvent.setup();
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /new customer/i }));

    await user.type(screen.getByLabelText(/customer name/i), "Acme Co");
    await user.selectOptions(screen.getByLabelText(/^customer type/i), "Company");
    await user.type(screen.getByLabelText(/opening balance/i), "100.00");
    await user.selectOptions(screen.getByLabelText(/^balance type/i), "Debit");
    await user.selectOptions(screen.getByLabelText(/^currency/i), "AED");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText("CUS0001")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/customers",
      expect.objectContaining({ method: "POST" })
    );
  });
});
