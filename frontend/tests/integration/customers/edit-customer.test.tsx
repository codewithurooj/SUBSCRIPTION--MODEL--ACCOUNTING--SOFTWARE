import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: "1" }),
}));

import EditCustomerPage from "@/app/(dashboard)/masters/customers/[id]/edit/page";

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

describe("Editing a customer through the dedicated Edit Customer page", () => {
  beforeEach(() => {
    pushMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "PATCH") {
          return Promise.resolve({ ok: true, json: async () => existingCustomer });
        }
        if (url === "/api/customers/1") {
          return Promise.resolve({ ok: true, json: async () => existingCustomer });
        }
        return Promise.reject(new Error("unexpected fetch"));
      })
    );
  });

  it("loads the existing customer, prefills the form, and saves changes via PATCH", async () => {
    const user = userEvent.setup();
    render(<EditCustomerPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/customer name/i)).toHaveValue("Acme Co");
    });

    await user.clear(screen.getByLabelText(/customer name/i));
    await user.type(screen.getByLabelText(/customer name/i), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/customers/1",
        expect.objectContaining({ method: "PATCH" })
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/masters/customers");
    });
  });

  it("shows an error when the customer fails to load", async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: async () => ({}) } as Response)
    );
    render(<EditCustomerPage />);

    await waitFor(() => {
      expect(screen.getByText(/could not load this customer/i)).toBeInTheDocument();
    });
  });
});
