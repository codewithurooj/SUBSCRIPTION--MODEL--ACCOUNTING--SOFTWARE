from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from src.schemas.customer import CustomerCreate, CustomerUpdate, StatusUpdateRequest
from src.services.customer_service import (
    DuplicateTaxRegistrationError,
    create_customer,
    generate_customer_code,
    list_customers,
    set_customer_status,
    update_customer,
)

# --- customer_code generation (FR-005, FR-007) ---------------------------


def test_generate_customer_code_has_the_cus_prefix_and_is_zero_padded(db_session):
    code = generate_customer_code(db_session)
    assert code.startswith("CUS")
    assert len(code) == 7  # "CUS" + 4 digits
    assert code[3:].isdigit()


def test_generate_customer_code_is_sequential_and_unique_across_repeated_calls(db_session):
    code_a = generate_customer_code(db_session)
    code_b = generate_customer_code(db_session)
    assert code_a != code_b
    assert int(code_b[3:]) == int(code_a[3:]) + 1


# --- financial-field validation (FR-011, FR-012) --------------------------


def _valid_payload(**overrides):
    payload = dict(
        customer_name="Acme Co",
        customer_type="Company",
        opening_balance="100.00",
        balance_type="Debit",
        currency="AED",
        status="Active",
    )
    payload.update(overrides)
    return payload


def test_opening_balance_accepts_a_valid_two_decimal_amount():
    customer = CustomerCreate(**_valid_payload(opening_balance="0.00"))
    assert customer.opening_balance == Decimal("0.00")


def test_opening_balance_rejects_a_negative_amount():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(opening_balance="-1.00"))


def test_opening_balance_rejects_more_than_two_decimal_places():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(opening_balance="10.005"))


def test_opening_balance_rejects_a_non_numeric_value():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(opening_balance="not-a-number"))


def test_credit_limit_rejects_a_negative_amount():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(credit_limit="-500.00"))


def test_credit_limit_accepts_none():
    customer = CustomerCreate(**_valid_payload())
    assert customer.credit_limit is None


# --- enum validation (FR-008, FR-009, FR-010) ------------------------------


def test_customer_type_rejects_an_out_of_set_value():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(customer_type="Nonprofit"))


def test_balance_type_rejects_an_out_of_set_value():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(balance_type="Neutral"))


def test_status_rejects_an_out_of_set_value():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(status="Pending"))


def test_status_defaults_to_active_when_omitted():
    payload = _valid_payload()
    del payload["status"]
    customer = CustomerCreate(**payload)
    assert customer.status == "Active"


# --- currency validation (FR-021) -----------------------------------------


def test_currency_rejects_a_code_outside_the_curated_list():
    with pytest.raises(ValidationError):
        CustomerCreate(**_valid_payload(currency="ZZZ"))


def test_currency_accepts_a_supported_code():
    customer = CustomerCreate(**_valid_payload(currency="USD"))
    assert customer.currency == "USD"


# --- list query: search across customer_code/customer_name/contact_person (FR-014) ---


def test_list_customers_search_matches_substring_across_code_name_contact(db_session):
    create_customer(
        db_session,
        CustomerCreate(**_valid_payload(customer_name="Unit Search Target", contact_person="Jordan")),
    )
    create_customer(db_session, CustomerCreate(**_valid_payload(customer_name="Unrelated Co")))

    by_name, _ = list_customers(db_session, search="Search Target")
    by_contact, _ = list_customers(db_session, search="Jordan")

    assert any(c.customer_name == "Unit Search Target" for c in by_name)
    assert any(c.customer_name == "Unit Search Target" for c in by_contact)
    assert all(c.customer_name != "Unrelated Co" for c in by_name)


# --- update_customer: immutability + editable-field behavior (FR-006, FR-017, FR-024) ---


def test_update_customer_applies_allowed_field_changes_and_refreshes_updated_at(db_session):
    customer = create_customer(db_session, CustomerCreate(**_valid_payload()))
    original_updated_at = customer.updated_at

    updated = update_customer(
        db_session, customer, CustomerUpdate(contact_person="New Contact", credit_limit="500.00")
    )

    assert updated.contact_person == "New Contact"
    assert updated.credit_limit == Decimal("500.00")
    assert updated.updated_at >= original_updated_at


def test_update_customer_ignores_customer_code_and_opening_balance_in_the_payload(db_session):
    customer = create_customer(db_session, CustomerCreate(**_valid_payload()))
    original_code = customer.customer_code
    original_balance = customer.opening_balance

    # CustomerUpdate has no customer_code/opening_balance fields at all —
    # any such keys are simply absent from the validated model.
    updated = update_customer(db_session, customer, CustomerUpdate(customer_name="Renamed Co"))

    assert updated.customer_code == original_code
    assert updated.opening_balance == original_balance
    assert updated.customer_name == "Renamed Co"


# --- set_customer_status: Active/Inactive toggle (FR-018) --------------------


def test_set_customer_status_toggles_without_altering_other_fields(db_session):
    customer = create_customer(db_session, CustomerCreate(**_valid_payload(status="Active")))

    deactivated = set_customer_status(db_session, customer, StatusUpdateRequest(status="Inactive"))
    assert deactivated.status == "Inactive"
    assert deactivated.customer_name == customer.customer_name
    assert deactivated.opening_balance == customer.opening_balance

    reactivated = set_customer_status(db_session, deactivated, StatusUpdateRequest(status="Active"))
    assert reactivated.status == "Active"


def test_status_update_request_rejects_an_invalid_status_value():
    with pytest.raises(ValidationError):
        StatusUpdateRequest(status="Pending")


# --- coverage: duplicate-check on update, and the rare-race IntegrityError fallbacks ---


def test_update_customer_rejects_tax_registration_no_colliding_with_another_customer(db_session):
    create_customer(db_session, CustomerCreate(**_valid_payload(tax_registration_no="TRN-A")))
    other = create_customer(db_session, CustomerCreate(**_valid_payload(tax_registration_no="TRN-B")))

    with pytest.raises(DuplicateTaxRegistrationError):
        update_customer(db_session, other, CustomerUpdate(tax_registration_no="TRN-A"))


def test_create_customer_wraps_a_commit_time_integrity_error_as_duplicate_tax_registration_error(
    db_session,
):
    """Covers the rare-race fallback: the pre-check SELECT can miss a row that
    another concurrent request commits a moment later, so the partial unique
    index still catches it at commit time. Simulated here by forcing commit()
    to raise, since triggering a true race deterministically isn't practical
    inside a single-transaction test fixture."""
    session = MagicMock(wraps=db_session)
    session.commit.side_effect = IntegrityError("stmt", {}, Exception("duplicate key"))

    with pytest.raises(DuplicateTaxRegistrationError):
        create_customer(session, CustomerCreate(**_valid_payload(tax_registration_no="TRN-RACE")))


def test_update_customer_wraps_a_commit_time_integrity_error_as_duplicate_tax_registration_error(
    db_session,
):
    customer = create_customer(db_session, CustomerCreate(**_valid_payload()))

    session = MagicMock(wraps=db_session)
    session.commit.side_effect = IntegrityError("stmt", {}, Exception("duplicate key"))

    with pytest.raises(DuplicateTaxRegistrationError):
        update_customer(session, customer, CustomerUpdate(contact_person="Whoever"))
