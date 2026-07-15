import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerStatusToggle } from "@/components/customers/CustomerStatusToggle";
import type { Customer } from "@/lib/types/customer";

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
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
    ...overrides,
  };
}

describe("CustomerStatusToggle", () => {
  it("shows a Deactivate action for an Active customer and calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<CustomerStatusToggle customer={customer({ status: "Active" })} onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: /deactivate/i });
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledWith(customer({ status: "Active" }));
  });

  it("shows a Reactivate action for an Inactive customer and calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(
      <CustomerStatusToggle customer={customer({ status: "Inactive" })} onToggle={onToggle} />
    );

    fireEvent.click(screen.getByRole("button", { name: /reactivate/i }));
    expect(onToggle).toHaveBeenCalledWith(customer({ status: "Inactive" }));
  });

  it("never renders a delete action", () => {
    render(<CustomerStatusToggle customer={customer()} onToggle={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});
