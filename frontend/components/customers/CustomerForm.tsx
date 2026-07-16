"use client";

import { useState, type FormEvent } from "react";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import {
  emptyCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/types/customer";

export interface CustomerFormProps {
  mode: "create" | "edit";
  initialValues?: CustomerFormValues;
  customerCode?: string;
  onSubmit: (values: CustomerFormValues) => void | Promise<void>;
  onCancel?: () => void;
}

type FormErrors = Partial<Record<keyof CustomerFormValues, string>>;

function validateDecimal(
  value: string,
  fieldLabel: string,
  required: boolean
): string | undefined {
  if (!value) {
    return required ? `${fieldLabel} is required` : undefined;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return `${fieldLabel} must be a valid number`;
  }
  if (numeric < 0) {
    return `${fieldLabel} must not be negative`;
  }
  const decimalPart = value.split(".")[1];
  if (decimalPart && decimalPart.length > 2) {
    return `${fieldLabel} must have at most 2 decimal places`;
  }
  return undefined;
}

function validate(values: CustomerFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.customer_name.trim()) {
    errors.customer_name = "Customer name is required";
  }
  if (!values.customer_type) {
    errors.customer_type = "Customer type is required";
  }
  if (!values.balance_type) {
    errors.balance_type = "Balance type is required";
  }
  if (!values.currency) {
    errors.currency = "Currency is required";
  }

  const openingBalanceError = validateDecimal(values.opening_balance, "Opening balance", true);
  if (openingBalanceError) errors.opening_balance = openingBalanceError;

  const creditLimitError = validateDecimal(values.credit_limit, "Credit limit", false);
  if (creditLimitError) errors.credit_limit = creditLimitError;

  if (values.payment_terms && Number(values.payment_terms) < 0) {
    errors.payment_terms = "Payment terms must not be negative";
  }

  return errors;
}

export function CustomerForm({
  mode,
  initialValues,
  customerCode,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>(
    initialValues ?? emptyCustomerFormValues
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof CustomerFormValues>(field: K, value: CustomerFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = mode === "edit";

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      {isEdit && (
        <div>
          <label className="block text-sm font-medium text-ink-700">Customer code</label>
          <input
            value={customerCode ?? ""}
            readOnly
            disabled
            className="mt-1 w-full rounded border border-paper-300 bg-paper-100 px-3 py-2 font-mono text-ink-700"
          />
        </div>
      )}

      <div>
        <label htmlFor="customer_name" className="block text-sm font-medium text-ink-700">
          Customer name
        </label>
        <input
          id="customer_name"
          value={values.customer_name}
          onChange={(e) => update("customer_name", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
        {errors.customer_name && <p className="text-sm text-rust-700">{errors.customer_name}</p>}
      </div>

      <div>
        <label htmlFor="customer_type" className="block text-sm font-medium text-ink-700">
          Customer type
        </label>
        <select
          id="customer_type"
          value={values.customer_type}
          onChange={(e) => update("customer_type", e.target.value as CustomerFormValues["customer_type"])}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        >
          <option value="">Select...</option>
          <option value="Individual">Individual</option>
          <option value="Company">Company</option>
        </select>
        {errors.customer_type && <p className="text-sm text-rust-700">{errors.customer_type}</p>}
      </div>

      <div>
        <label htmlFor="contact_person" className="block text-sm font-medium text-ink-700">
          Contact person
        </label>
        <input
          id="contact_person"
          value={values.contact_person}
          onChange={(e) => update("contact_person", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="mobile" className="block text-sm font-medium text-ink-700">
          Mobile
        </label>
        <input
          id="mobile"
          value={values.mobile}
          onChange={(e) => update("mobile", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink-700">
          Phone
        </label>
        <input
          id="phone"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-ink-700">
          Website
        </label>
        <input
          id="website"
          value={values.website}
          onChange={(e) => update("website", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="tax_registration_no" className="block text-sm font-medium text-ink-700">
          Tax registration no.
        </label>
        <input
          id="tax_registration_no"
          value={values.tax_registration_no}
          onChange={(e) => update("tax_registration_no", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="opening_balance" className="block text-sm font-medium text-ink-700">
          Opening balance
        </label>
        <input
          id="opening_balance"
          autoComplete="off"
          value={values.opening_balance}
          onChange={(e) => update("opening_balance", e.target.value)}
          readOnly={isEdit}
          disabled={isEdit}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none disabled:bg-paper-100"
        />
        {errors.opening_balance && <p className="text-sm text-rust-700">{errors.opening_balance}</p>}
      </div>

      <div>
        <label htmlFor="balance_type" className="block text-sm font-medium text-ink-700">
          Balance type
        </label>
        <select
          id="balance_type"
          value={values.balance_type}
          onChange={(e) => update("balance_type", e.target.value as CustomerFormValues["balance_type"])}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        >
          <option value="">Select...</option>
          <option value="Debit">Debit</option>
          <option value="Credit">Credit</option>
        </select>
        {errors.balance_type && <p className="text-sm text-rust-700">{errors.balance_type}</p>}
      </div>

      <div>
        <label htmlFor="credit_limit" className="block text-sm font-medium text-ink-700">
          Credit limit
        </label>
        <input
          id="credit_limit"
          autoComplete="off"
          value={values.credit_limit}
          onChange={(e) => update("credit_limit", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
        {errors.credit_limit && <p className="text-sm text-rust-700">{errors.credit_limit}</p>}
      </div>

      <div>
        <label htmlFor="payment_terms" className="block text-sm font-medium text-ink-700">
          Payment terms (days)
        </label>
        <input
          id="payment_terms"
          autoComplete="off"
          value={values.payment_terms}
          onChange={(e) => update("payment_terms", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
        {errors.payment_terms && <p className="text-sm text-rust-700">{errors.payment_terms}</p>}
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-ink-700">
          Currency
        </label>
        <select
          id="currency"
          value={values.currency}
          onChange={(e) => update("currency", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        >
          <option value="">Select...</option>
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        {errors.currency && <p className="text-sm text-rust-700">{errors.currency}</p>}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-ink-700">
          Status
        </label>
        <select
          id="status"
          value={values.status}
          onChange={(e) => update("status", e.target.value as CustomerFormValues["status"])}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-ink-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="mt-1 w-full rounded border border-paper-300 px-3 py-2 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-sm transition-colors hover:bg-gold-600 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-paper-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-paper-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
