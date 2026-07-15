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
      className="text-sm underline"
    >
      {isActive ? "Deactivate" : "Reactivate"}
    </button>
  );
}
