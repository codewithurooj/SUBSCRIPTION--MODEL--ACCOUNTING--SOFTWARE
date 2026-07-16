"use client";

import { CustomerStatusToggle } from "@/components/customers/CustomerStatusToggle";
import type { Customer } from "@/lib/types/customer";

export type SortableColumn =
  | "customer_code"
  | "customer_name"
  | "customer_type"
  | "balance_type"
  | "status";

const COLUMNS: { key: SortableColumn; label: string }[] = [
  { key: "customer_code", label: "Code" },
  { key: "customer_name", label: "Customer name" },
  { key: "customer_type", label: "Type" },
  { key: "balance_type", label: "Balance type" },
  { key: "status", label: "Status" },
];

export interface CustomerTableProps {
  customers: Customer[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: "" | "Active" | "Inactive";
  onStatusFilterChange: (value: "" | "Active" | "Inactive") => void;
  sortBy: SortableColumn;
  sortOrder: "asc" | "desc";
  onSortChange: (column: SortableColumn, order: "asc" | "desc") => void;
  onEdit?: (customer: Customer) => void;
  onToggleStatus?: (customer: Customer) => void;
}

export function CustomerTable({
  customers,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onToggleStatus,
}: CustomerTableProps) {
  function handleHeaderClick(column: SortableColumn) {
    const nextOrder: "asc" | "desc" =
      sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(column, sortBy === column ? nextOrder : "asc");
  }

  return (
    <div>
      <div className="mb-4 flex gap-4">
        <input
          role="searchbox"
          placeholder="Search customers..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-paper-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Status filter
          </label>
          <select
            id="status-filter"
            aria-label="Status filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as "" | "Active" | "Inactive")}
            className="rounded border border-paper-300 px-3 py-2 text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="Active">Active only</option>
            <option value="Inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-paper-100">
            {COLUMNS.map((col) => (
              <th key={col.key} className="border-b border-paper-300 p-2">
                <button
                  type="button"
                  onClick={() => handleHeaderClick(col.key)}
                  className="font-semibold text-ink-700 hover:text-gold-700"
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span className="text-gold-600"> {sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              </th>
            ))}
            {(onEdit || onToggleStatus) && (
              <th className="border-b border-paper-300 p-2 font-semibold text-ink-700">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length + (onEdit || onToggleStatus ? 1 : 0)}
                className="border-b border-paper-200 p-6 text-center text-ink-500"
              >
                No customers found.
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-paper-100/60">
                <td className="border-b border-paper-200 p-2 font-mono text-ink-700">
                  {customer.customer_code}
                </td>
                <td className="border-b border-paper-200 p-2">{customer.customer_name}</td>
                <td className="border-b border-paper-200 p-2">{customer.customer_type}</td>
                <td className="border-b border-paper-200 p-2">{customer.balance_type}</td>
                <td className="border-b border-paper-200 p-2">
                  <span
                    className={
                      customer.status === "Active"
                        ? "inline-block rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                        : "inline-block rounded-full bg-rust-600/10 px-2 py-0.5 text-xs font-semibold text-rust-700"
                    }
                  >
                    {customer.status}
                  </span>
                </td>
                {(onEdit || onToggleStatus) && (
                  <td className="border-b border-paper-200 p-2">
                    <div className="flex gap-3">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="text-sm font-medium text-gold-700 hover:text-gold-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      {onToggleStatus && (
                        <CustomerStatusToggle customer={customer} onToggle={onToggleStatus} />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
