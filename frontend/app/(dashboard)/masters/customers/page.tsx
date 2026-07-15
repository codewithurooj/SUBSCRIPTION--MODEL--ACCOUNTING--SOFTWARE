"use client";

import { useCallback, useEffect, useState } from "react";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerTable, type SortableColumn } from "@/components/customers/CustomerTable";
import {
  customerToFormValues,
  type Customer,
  type CustomerFormValues,
} from "@/lib/types/customer";

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Active" | "Inactive">("");
  const [sortBy, setSortBy] = useState<SortableColumn>("customer_code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    const params = new URLSearchParams({
      sort_by: sortBy,
      sort_order: sortOrder,
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const response = await fetch(`/api/customers?${params.toString()}`);
    if (!response.ok) return;
    const data = await response.json();
    setCustomers(data.items);
    setTotal(data.total);
  }, [search, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    // Standard data-fetch-on-param-change effect (react.dev "You Might Not
    // Need an Effect" pattern) — setState happens after the awaited fetch
    // resolves, not synchronously in the effect body itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers]);

  function stripEmptyStrings(values: CustomerFormValues): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...values };
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") delete payload[key];
    }
    return payload;
  }

  async function handleCreate(values: CustomerFormValues) {
    setCreateError(null);

    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stripEmptyStrings(values)),
    });

    if (!response.ok) {
      setCreateError("Could not create the customer. Please check the form and try again.");
      return;
    }

    setCreateOpen(false);
    setPage(1);
    await fetchCustomers();
  }

  async function handleToggleStatus(customer: Customer) {
    const nextStatus = customer.status === "Active" ? "Inactive" : "Active";
    const response = await fetch(`/api/customers/${customer.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) {
      await fetchCustomers();
    }
  }

  async function handleEditSubmit(values: CustomerFormValues) {
    if (!editingCustomer) return;
    setEditError(null);

    const response = await fetch(`/api/customers/${editingCustomer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stripEmptyStrings(values)),
    });

    if (!response.ok) {
      setEditError("Could not save changes. Please check the form and try again.");
      return;
    }

    setEditingCustomer(null);
    await fetchCustomers();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilterChange(value: "" | "Active" | "Inactive") {
    setStatusFilter(value);
    setPage(1);
  }

  function handleSortChange(column: SortableColumn, order: "asc" | "desc") {
    setSortBy(column);
    setSortOrder(order);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded bg-black px-4 py-2 text-white"
        >
          New Customer
        </button>
      </div>

      <div className="mt-6">
        <CustomerTable
          customers={customers}
          searchValue={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onEdit={(customer) => setEditingCustomer(customer)}
          onToggleStatus={handleToggleStatus}
        />

        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">New Customer</h2>
            {createError && <p className="mb-4 text-sm text-red-600">{createError}</p>}
            <CustomerForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Edit Customer</h2>
            {editError && <p className="mb-4 text-sm text-red-600">{editError}</p>}
            <CustomerForm
              mode="edit"
              customerCode={editingCustomer.customer_code}
              initialValues={customerToFormValues(editingCustomer)}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingCustomer(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
