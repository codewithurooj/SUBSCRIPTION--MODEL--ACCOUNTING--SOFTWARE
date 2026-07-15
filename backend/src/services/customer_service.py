from datetime import UTC, datetime

from sqlalchemy import func, or_, text
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from src.models.customer import Customer
from src.schemas.customer import CustomerCreate, CustomerUpdate, StatusUpdateRequest

SORTABLE_COLUMNS = {
    "customer_code": Customer.customer_code,
    "customer_name": Customer.customer_name,
    "customer_type": Customer.customer_type,
    "balance_type": Customer.balance_type,
    "status": Customer.status,
}


class DuplicateTaxRegistrationError(Exception):
    """Raised when tax_registration_no collides with an existing customer (FR-020)."""


def generate_customer_code(session: Session) -> str:
    """Atomically allocates the next customer_code via a Postgres sequence —
    safe under concurrent calls, unlike a SELECT MAX(id)+1 pattern (FR-007,
    research.md #3)."""
    row = session.exec(text("SELECT nextval('customers_code_seq')")).one()
    return f"CUS{int(row[0]):04d}"


def create_customer(session: Session, data: CustomerCreate) -> Customer:
    if data.tax_registration_no:
        existing = session.exec(
            select(Customer).where(Customer.tax_registration_no == data.tax_registration_no)
        ).first()
        if existing is not None:
            raise DuplicateTaxRegistrationError(
                f"tax_registration_no '{data.tax_registration_no}' is already in use"
            )

    customer = Customer(
        customer_code=generate_customer_code(session),
        customer_name=data.customer_name,
        contact_person=data.contact_person,
        mobile=data.mobile,
        phone=data.phone,
        email=data.email,
        website=data.website,
        tax_registration_no=data.tax_registration_no,
        customer_type=data.customer_type,
        opening_balance=data.opening_balance,
        balance_type=data.balance_type,
        credit_limit=data.credit_limit,
        payment_terms=data.payment_terms,
        currency=data.currency,
        status=data.status,
        notes=data.notes,
    )
    session.add(customer)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        # Fallback for the rare race the pre-check above can't catch
        # (two requests passing the SELECT check before either commits).
        raise DuplicateTaxRegistrationError(
            f"tax_registration_no '{data.tax_registration_no}' is already in use"
        ) from exc
    session.refresh(customer)
    return customer


def set_customer_status(
    session: Session, customer: Customer, data: StatusUpdateRequest
) -> Customer:
    """FR-018: toggles Active/Inactive only — no other field is touched, and
    there is no path to a deleted state (FR-019)."""
    customer.status = data.status
    customer.updated_at = datetime.now(UTC)
    session.add(customer)
    session.commit()
    session.refresh(customer)
    return customer


def list_customers(
    session: Session,
    search: str | None = None,
    status_filter: str | None = None,
    sort_by: str = "customer_code",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 25,
) -> tuple[list[Customer], int]:
    """FR-013/FR-014/FR-015: paginated, status-filterable, substring-searchable,
    sortable list. Returns (items, total) so the route can build CustomerListResponse."""
    query = select(Customer)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Customer.customer_code.ilike(pattern),
                Customer.customer_name.ilike(pattern),
                Customer.contact_person.ilike(pattern),
            )
        )

    if status_filter:
        query = query.where(Customer.status == status_filter)

    sort_column = SORTABLE_COLUMNS.get(sort_by, Customer.customer_code)
    query = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())

    total = session.exec(select(func.count()).select_from(query.subquery())).one()

    items = session.exec(query.offset((page - 1) * page_size).limit(page_size)).all()
    return list(items), int(total)


def get_customer(session: Session, customer_id: int) -> Customer | None:
    return session.get(Customer, customer_id)


def update_customer(session: Session, customer: Customer, data: CustomerUpdate) -> Customer:
    """FR-006/FR-017/FR-024: id, customer_code, opening_balance, created_at
    simply don't exist as fields on CustomerUpdate, so there is nothing for
    this function to even accidentally apply — only whatever was actually
    provided (exclude_unset) is written, and updated_at always refreshes."""
    update_fields = data.model_dump(exclude_unset=True)

    if "tax_registration_no" in update_fields and update_fields["tax_registration_no"]:
        existing = session.exec(
            select(Customer).where(
                Customer.tax_registration_no == update_fields["tax_registration_no"],
                Customer.id != customer.id,
            )
        ).first()
        if existing is not None:
            raise DuplicateTaxRegistrationError(
                f"tax_registration_no '{update_fields['tax_registration_no']}' is already in use"
            )

    for field, value in update_fields.items():
        setattr(customer, field, value)

    customer.updated_at = datetime.now(UTC)
    session.add(customer)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise DuplicateTaxRegistrationError(
            "tax_registration_no is already in use"
        ) from exc
    session.refresh(customer)
    return customer
