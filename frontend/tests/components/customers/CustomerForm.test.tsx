import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { customerToFormValues, type Customer } from "@/lib/types/customer";

const existingCustomer: Customer = {
  id: 1,
  customer_code: "CUS0001",
  customer_name: "Acme Co",
  contact_person: "Old Contact",
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

describe("CustomerForm (create mode)", () => {
  it("blocks submit and shows an inline error when customer_name is missing", async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm mode="create" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/customer name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit and shows an inline error when opening_balance is missing", async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm mode="create" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: "Acme Co" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/opening balance is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits successfully when all required fields are filled in", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CustomerForm mode="create" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: "Acme Co" },
    });
    fireEvent.change(screen.getByLabelText(/^customer type/i), {
      target: { value: "Company" },
    });
    fireEvent.change(screen.getByLabelText(/opening balance/i), {
      target: { value: "100.00" },
    });
    fireEvent.change(screen.getByLabelText(/^balance type/i), {
      target: { value: "Debit" },
    });
    fireEvent.change(screen.getByLabelText(/^currency/i), {
      target: { value: "AED" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: "Acme Co",
        customer_type: "Company",
        opening_balance: "100.00",
        balance_type: "Debit",
        currency: "AED",
        status: "Active",
      })
    );
  });

  it("rejects a negative opening_balance client-side", async () => {
    const onSubmit = vi.fn();
    render(<CustomerForm mode="create" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: "Acme Co" },
    });
    fireEvent.change(screen.getByLabelText(/opening balance/i), {
      target: { value: "-5.00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/opening balance must not be negative/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("CustomerForm (edit mode)", () => {
  it("renders customer_code and opening_balance as read-only", () => {
    render(
      <CustomerForm
        mode="edit"
        customerCode={existingCustomer.customer_code}
        initialValues={customerToFormValues(existingCustomer)}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue("CUS0001")).toBeDisabled();
    expect(screen.getByLabelText(/opening balance/i)).toBeDisabled();
  });

  it("still submits other field changes while opening_balance/customer_code are ignored", async () => {
    const onSubmit = vi.fn();
    render(
      <CustomerForm
        mode="edit"
        customerCode={existingCustomer.customer_code}
        initialValues={customerToFormValues(existingCustomer)}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/contact person/i), {
      target: { value: "New Contact" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_person: "New Contact",
        opening_balance: "100.00",
      })
    );
  });
});
