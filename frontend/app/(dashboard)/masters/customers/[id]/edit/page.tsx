"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers/CustomerForm";
import {
  customerToFormValues,
  type Customer,
  type CustomerFormValues,
} from "@/lib/types/customer";

function stripEmptyStrings(values: CustomerFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  for (const key of Object.keys(payload)) {
    if (payload[key] === "") delete payload[key];
  }
  return payload;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomer() {
      const response = await fetch(`/api/customers/${id}`);
      if (cancelled) return;
      if (!response.ok) {
        setLoadError(true);
        return;
      }
      setCustomer(await response.json());
    }

    loadCustomer();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleEditSubmit(values: CustomerFormValues) {
    setSubmitError(null);

    const response = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stripEmptyStrings(values)),
    });

    if (!response.ok) {
      setSubmitError("Could not save changes. Please check the form and try again.");
      return;
    }

    router.push("/masters/customers");
  }

  if (loadError) {
    return (
      <div className="p-6">
        <p className="rounded border border-rust-600/30 bg-rust-600/10 px-3 py-2 text-sm text-rust-700">
          Could not load this customer.
        </p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-sm text-ink-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-xs font-semibold tracking-widest text-gold-600 uppercase">Masters</p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">Edit Customer</h1>
      {submitError && (
        <p className="mb-4 rounded border border-rust-600/30 bg-rust-600/10 px-3 py-2 text-sm text-rust-700">
          {submitError}
        </p>
      )}
      <div className="max-w-lg rounded-lg border border-paper-300 bg-white p-6 shadow-sm">
        <CustomerForm
          mode="edit"
          customerCode={customer.customer_code}
          initialValues={customerToFormValues(customer)}
          onSubmit={handleEditSubmit}
          onCancel={() => router.push("/masters/customers")}
        />
      </div>
    </div>
  );
}
