import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomerTable } from "@/components/customers/CustomerTable";
import type { Customer } from "@/lib/types/customer";

const sampleCustomer: Customer = {
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

function noop() {}

describe("CustomerTable", () => {
  it("renders an empty state when there are no customers", () => {
    render(
      <CustomerTable
        customers={[]}
        searchValue=""
        onSearchChange={noop}
        statusFilter=""
        onStatusFilterChange={noop}
        sortBy="customer_code"
        sortOrder="asc"
        onSortChange={noop}
      />
    );

    expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
  });

  it("renders a row per customer when results exist", () => {
    render(
      <CustomerTable
        customers={[sampleCustomer]}
        searchValue=""
        onSearchChange={noop}
        statusFilter=""
        onStatusFilterChange={noop}
        sortBy="customer_code"
        sortOrder="asc"
        onSortChange={noop}
      />
    );

    expect(screen.getByText("CUS0001")).toBeInTheDocument();
    expect(screen.getByText("Acme Co")).toBeInTheDocument();
  });

  it("calls onSearchChange as the user types in the search box", () => {
    const onSearchChange = vi.fn();
    render(
      <CustomerTable
        customers={[]}
        searchValue=""
        onSearchChange={onSearchChange}
        statusFilter=""
        onStatusFilterChange={noop}
        sortBy="customer_code"
        sortOrder="asc"
        onSortChange={noop}
      />
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "acme" } });
    expect(onSearchChange).toHaveBeenCalledWith("acme");
  });

  it("calls onSortChange, flipping order, when a sortable column header is clicked", () => {
    const onSortChange = vi.fn();
    render(
      <CustomerTable
        customers={[]}
        searchValue=""
        onSearchChange={noop}
        statusFilter=""
        onStatusFilterChange={noop}
        sortBy="customer_code"
        sortOrder="asc"
        onSortChange={onSortChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /customer name/i }));
    expect(onSortChange).toHaveBeenCalledWith("customer_name", "asc");
  });

  it("calls onStatusFilterChange when the status filter is changed", () => {
    const onStatusFilterChange = vi.fn();
    render(
      <CustomerTable
        customers={[]}
        searchValue=""
        onSearchChange={noop}
        statusFilter=""
        onStatusFilterChange={onStatusFilterChange}
        sortBy="customer_code"
        sortOrder="asc"
        onSortChange={noop}
      />
    );

    fireEvent.change(screen.getByLabelText(/status filter/i), { target: { value: "Active" } });
    expect(onStatusFilterChange).toHaveBeenCalledWith("Active");
  });
});
