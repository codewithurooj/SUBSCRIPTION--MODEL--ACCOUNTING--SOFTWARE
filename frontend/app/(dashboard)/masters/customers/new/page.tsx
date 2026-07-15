"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";
import type { CustomerFormValues } from "@/lib/types/customer";

function stripEmptyStrings(values: CustomerFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  for (const key of Object.keys(payload)) {
    if (payload[key] === "") delete payload[key];
  }
  return payload;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(values: CustomerFormValues) {
    setError(null);

    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stripEmptyStrings(values)),
    });

    if (!response.ok) {
      setError("Could not create the customer. Please check the form and try again.");
      return;
    }

    router.push("/masters/customers");
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">New Customer</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="max-w-lg">
        <CustomerForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => router.push("/masters/customers")}
        />
      </div>
    </div>
  );
}
