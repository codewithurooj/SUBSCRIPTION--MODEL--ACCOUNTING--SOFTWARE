"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerTable, type SortableColumn } from "@/components/customers/CustomerTable";
import type { Customer } from "@/lib/types/customer";

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const router = useRouter();

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
        <Link
          href="/masters/customers/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          New Customer
        </Link>
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
          onEdit={(customer) => router.push(`/masters/customers/${customer.id}/edit`)}
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
    </div>
  );
}
