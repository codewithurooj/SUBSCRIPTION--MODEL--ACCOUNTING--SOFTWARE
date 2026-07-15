export type CustomerType = "Individual" | "Company";
export type BalanceType = "Debit" | "Credit";
export type CustomerStatus = "Active" | "Inactive";

export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  contact_person: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  tax_registration_no: string | null;
  customer_type: CustomerType;
  opening_balance: string;
  balance_type: BalanceType;
  credit_limit: string | null;
  payment_terms: number | null;
  currency: string;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormValues {
  customer_name: string;
  contact_person: string;
  mobile: string;
  phone: string;
  email: string;
  website: string;
  tax_registration_no: string;
  customer_type: CustomerType | "";
  opening_balance: string;
  balance_type: BalanceType | "";
  credit_limit: string;
  payment_terms: string;
  currency: string;
  status: CustomerStatus;
  notes: string;
}

export const emptyCustomerFormValues: CustomerFormValues = {
  customer_name: "",
  contact_person: "",
  mobile: "",
  phone: "",
  email: "",
  website: "",
  tax_registration_no: "",
  customer_type: "",
  opening_balance: "",
  balance_type: "",
  credit_limit: "",
  payment_terms: "",
  currency: "",
  status: "Active",
  notes: "",
};

export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    customer_name: customer.customer_name,
    contact_person: customer.contact_person ?? "",
    mobile: customer.mobile ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    website: customer.website ?? "",
    tax_registration_no: customer.tax_registration_no ?? "",
    customer_type: customer.customer_type,
    opening_balance: customer.opening_balance,
    balance_type: customer.balance_type,
    credit_limit: customer.credit_limit ?? "",
    payment_terms: customer.payment_terms != null ? String(customer.payment_terms) : "",
    currency: customer.currency,
    status: customer.status,
    notes: customer.notes ?? "",
  };
}
