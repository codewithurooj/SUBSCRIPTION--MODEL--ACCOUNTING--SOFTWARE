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
          className="rounded border px-3 py-2"
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
            className="rounded border px-3 py-2"
          >
            <option value="">All statuses</option>
            <option value="Active">Active only</option>
            <option value="Inactive">Inactive only</option>
          </select>
        </div>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} className="border-b p-2">
                <button
                  type="button"
                  onClick={() => handleHeaderClick(col.key)}
                  className="font-medium"
                >
                  {col.label}
                  {sortBy === col.key && (sortOrder === "asc" ? " ▲" : " ▼")}
                </button>
              </th>
            ))}
            {(onEdit || onToggleStatus) && <th className="border-b p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length + (onEdit || onToggleStatus ? 1 : 0)}
                className="border-b p-6 text-center text-gray-500"
              >
                No customers found.
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <tr key={customer.id}>
                <td className="border-b p-2">{customer.customer_code}</td>
                <td className="border-b p-2">{customer.customer_name}</td>
                <td className="border-b p-2">{customer.customer_type}</td>
                <td className="border-b p-2">{customer.balance_type}</td>
                <td className="border-b p-2">{customer.status}</td>
                {(onEdit || onToggleStatus) && (
                  <td className="border-b p-2">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="text-sm underline"
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
