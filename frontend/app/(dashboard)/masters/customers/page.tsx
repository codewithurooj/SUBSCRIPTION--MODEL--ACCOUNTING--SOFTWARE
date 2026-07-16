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
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase">Masters</p>
          <h1 className="mt-1 text-2xl font-semibold">Customers</h1>
        </div>
        <Link
          href="/masters/customers/new"
          className="rounded bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-sm transition-colors hover:bg-gold-600"
        >
          New Customer
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-paper-300 bg-white p-4 shadow-sm">
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
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-paper-300 px-3 py-1 hover:bg-paper-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span className="text-ink-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-paper-300 px-3 py-1 hover:bg-paper-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
