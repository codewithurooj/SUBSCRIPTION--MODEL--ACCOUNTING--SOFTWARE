import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import NewCustomerPage from "@/app/(dashboard)/masters/customers/new/page";

describe("Creating a customer through the dedicated New Customer page", () => {
  beforeEach(() => {
    pushMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 1, customer_code: "CUS0001" }),
          });
        }
        return Promise.reject(new Error("unexpected fetch"));
      })
    );
  });

  it("submitting a valid create form POSTs via the BFF route and navigates back to the list", async () => {
    const user = userEvent.setup();
    render(<NewCustomerPage />);

    await user.type(screen.getByLabelText(/customer name/i), "Acme Co");
    await user.selectOptions(screen.getByLabelText(/^customer type/i), "Company");
    await user.type(screen.getByLabelText(/opening balance/i), "100.00");
    await user.selectOptions(screen.getByLabelText(/^balance type/i), "Debit");
    await user.selectOptions(screen.getByLabelText(/^currency/i), "AED");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/customers",
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/masters/customers");
    });
  });

  it("shows an error and does not navigate when the create request fails", async () => {
    vi.mocked(fetch).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: async () => ({ detail: "error" }) } as Response)
    );
    const user = userEvent.setup();
    render(<NewCustomerPage />);

    await user.type(screen.getByLabelText(/customer name/i), "Acme Co");
    await user.selectOptions(screen.getByLabelText(/^customer type/i), "Company");
    await user.type(screen.getByLabelText(/opening balance/i), "100.00");
    await user.selectOptions(screen.getByLabelText(/^balance type/i), "Debit");
    await user.selectOptions(screen.getByLabelText(/^currency/i), "AED");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not create the customer/i)).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
