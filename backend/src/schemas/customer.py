from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_serializer, field_validator

CustomerType = Literal["Individual", "Company"]
BalanceType = Literal["Debit", "Credit"]
CustomerStatus = Literal["Active", "Inactive"]

# Curated ISO 4217 codes relevant to this business's region (research.md #4).
# A VARCHAR(10) column backs this, not a native DB enum, so the list can grow
# without a migration — see data-model.md.
SUPPORTED_CURRENCIES = frozenset(
    {"AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD", "OMR", "BHD", "INR", "PKR"}
)


def _decimal_str(value: Decimal | None) -> str | None:
    return None if value is None else format(value, "f")


class _CustomerFieldsBase(BaseModel):
    customer_name: str | None = Field(default=None, max_length=150)
    contact_person: str | None = Field(default=None, max_length=100)
    mobile: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    website: str | None = Field(default=None, max_length=150)
    tax_registration_no: str | None = Field(default=None, max_length=50)
    customer_type: CustomerType | None = None
    balance_type: BalanceType | None = None
    credit_limit: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    payment_terms: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)
    status: CustomerStatus | None = None
    notes: str | None = None

    @field_validator("currency")
    @classmethod
    def _currency_must_be_supported(cls, value: str | None) -> str | None:
        if value is not None and value not in SUPPORTED_CURRENCIES:
            raise ValueError(f"Unsupported currency: {value}")
        return value


class CustomerCreate(_CustomerFieldsBase):
    """id, customer_code, created_at, updated_at are never accepted here —
    the field simply doesn't exist on this schema (FR-005/FR-006)."""

    customer_name: str = Field(max_length=150)
    customer_type: CustomerType
    opening_balance: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    balance_type: BalanceType
    currency: str = Field(max_length=10)
    status: CustomerStatus = "Active"


class CustomerUpdate(_CustomerFieldsBase):
    """Partial update. id, customer_code, opening_balance, created_at are
    never accepted here — they simply don't exist on this schema
    (FR-006/FR-024); any such keys in the raw request body are ignored."""


class StatusUpdateRequest(BaseModel):
    status: CustomerStatus


class CustomerRead(BaseModel):
    id: int
    customer_code: str
    customer_name: str
    contact_person: str | None
    mobile: str | None
    phone: str | None
    email: str | None
    website: str | None
    tax_registration_no: str | None
    customer_type: str
    opening_balance: Decimal
    balance_type: str
    credit_limit: Decimal | None
    payment_terms: int | None
    currency: str
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("opening_balance")
    def _serialize_opening_balance(self, value: Decimal) -> str:
        return _decimal_str(value)

    @field_serializer("credit_limit")
    def _serialize_credit_limit(self, value: Decimal | None) -> str | None:
        return _decimal_str(value)


class CustomerListResponse(BaseModel):
    items: list[CustomerRead]
    total: int
    page: int
    page_size: int
