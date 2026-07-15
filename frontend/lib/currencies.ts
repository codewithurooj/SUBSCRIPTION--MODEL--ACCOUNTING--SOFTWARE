// Curated ISO 4217 codes — must stay in sync with
// backend/src/schemas/customer.py's SUPPORTED_CURRENCIES (research.md #4).
export const SUPPORTED_CURRENCIES = [
  "AED",
  "USD",
  "EUR",
  "GBP",
  "SAR",
  "QAR",
  "KWD",
  "OMR",
  "BHD",
  "INR",
  "PKR",
] as const;
