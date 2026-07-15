"""initial: customers, customers_code_seq

Revision ID: b14c4c9b8ed6
Revises:
Create Date: 2026-07-14 07:03:43.787173

"""
from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b14c4c9b8ed6'
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Sequence backing customer_code generation (research.md #3) — safe under
    # concurrent create() calls, unlike a SELECT MAX(id)+1 pattern (FR-007).
    op.execute("CREATE SEQUENCE customers_code_seq START 1")

    op.create_table('customers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('customer_code', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('customer_name', sqlmodel.sql.sqltypes.AutoString(length=150), nullable=False),
    sa.Column('contact_person', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True),
    sa.Column('mobile', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    sa.Column('phone', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
    sa.Column('email', sqlmodel.sql.sqltypes.AutoString(length=150), nullable=True),
    sa.Column('website', sqlmodel.sql.sqltypes.AutoString(length=150), nullable=True),
    sa.Column('tax_registration_no', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True),
    sa.Column('customer_type', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
    sa.Column('opening_balance', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('balance_type', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
    sa.Column('credit_limit', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('payment_terms', sa.Integer(), nullable=True),
    sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
    sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.CheckConstraint("customer_type IN ('Individual', 'Company')", name='ck_customers_customer_type'),
    sa.CheckConstraint("balance_type IN ('Debit', 'Credit')", name='ck_customers_balance_type'),
    sa.CheckConstraint("status IN ('Active', 'Inactive')", name='ck_customers_status'),
    sa.CheckConstraint("opening_balance >= 0", name='ck_customers_opening_balance_nonneg'),
    sa.CheckConstraint("credit_limit IS NULL OR credit_limit >= 0", name='ck_customers_credit_limit_nonneg'),
    sa.CheckConstraint(
        "payment_terms IS NULL OR payment_terms >= 0", name='ck_customers_payment_terms_nonneg'
    ),
    )
    op.create_index(op.f('ix_customers_customer_code'), 'customers', ['customer_code'], unique=True)
    # Partial unique index: tax_registration_no unique only when provided (FR-020).
    op.create_index(
        'ix_customers_tax_registration_no_unique',
        'customers',
        ['tax_registration_no'],
        unique=True,
        postgresql_where=sa.text('tax_registration_no IS NOT NULL'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_customers_tax_registration_no_unique', table_name='customers')
    op.drop_index(op.f('ix_customers_customer_code'), table_name='customers')
    op.drop_table('customers')
    op.execute("DROP SEQUENCE customers_code_seq")
