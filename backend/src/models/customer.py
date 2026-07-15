from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import Column, Numeric, Text
from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC)


class Customer(SQLModel, table=True):
    """Customers master. See specs/002-customers-master/data-model.md."""

    __tablename__ = "customers"

    id: int | None = Field(default=None, primary_key=True)

    # Server-generated (customers_code_seq), immutable after creation (FR-005, FR-006, FR-024).
    customer_code: str = Field(max_length=20, unique=True, index=True)

    customer_name: str = Field(max_length=150)
    contact_person: str | None = Field(default=None, max_length=100)
    mobile: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=150)
    website: str | None = Field(default=None, max_length=150)

    # Unique when provided (FR-020); enforced via a partial unique index (migration 0001).
    tax_registration_no: str | None = Field(default=None, max_length=50)

    customer_type: str = Field(max_length=20)  # Individual | Company (FR-008)

    # Immutable after creation (FR-024); non-negative (FR-012).
    opening_balance: Decimal = Field(
        default=Decimal("0.00"), sa_column=Column(Numeric(12, 2), nullable=False)
    )

    balance_type: str = Field(max_length=10)  # Debit | Credit (FR-009)

    credit_limit: Decimal | None = Field(
        default=None, sa_column=Column(Numeric(12, 2), nullable=True)
    )
    payment_terms: int | None = Field(default=None)

    currency: str = Field(max_length=10)  # curated ISO 4217 list (FR-021)

    status: str = Field(default="Active", max_length=10)  # Active | Inactive (FR-010)

    notes: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
