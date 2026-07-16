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
      <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase">Masters</p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">New Customer</h1>
      {error && (
        <p className="mb-4 rounded border border-rust-600/30 bg-rust-600/10 px-3 py-2 text-sm text-rust-700">
          {error}
        </p>
      )}
      <div className="max-w-lg rounded-lg border border-paper-300 bg-white p-6 shadow-sm">
        <CustomerForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => router.push("/masters/customers")}
        />
      </div>
    </div>
  );
}
