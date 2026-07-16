"use client";

import type { Customer } from "@/lib/types/customer";

export interface CustomerStatusToggleProps {
  customer: Customer;
  onToggle: (customer: Customer) => void | Promise<void>;
}

// No delete action exists here, or anywhere else in this feature — FR-019
// guarantees no hard-delete path in the UI or the API.
export function CustomerStatusToggle({ customer, onToggle }: CustomerStatusToggleProps) {
  const isActive = customer.status === "Active";

  return (
    <button
      type="button"
      onClick={() => onToggle(customer)}
      className={
        isActive
          ? "text-sm font-medium text-rust-700 hover:text-rust-600 hover:underline"
          : "text-sm font-medium text-emerald-700 hover:text-emerald-600 hover:underline"
      }
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
