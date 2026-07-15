from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from src.core.db import get_session
from src.schemas.customer import (
    CustomerCreate,
    CustomerListResponse,
    CustomerRead,
    CustomerUpdate,
    StatusUpdateRequest,
)
from src.services.customer_service import (
    create_customer,
    get_customer,
    list_customers,
    set_customer_status,
    update_customer,
)

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers_endpoint(
    session: Session = Depends(get_session),
    search: str | None = None,
    status: Literal["Active", "Inactive"] | None = None,
    sort_by: str = "customer_code",
    sort_order: Literal["asc", "desc"] = "asc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
) -> CustomerListResponse:
    items, total = list_customers(
        session,
        search=search,
        status_filter=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return CustomerListResponse(
        items=[CustomerRead.model_validate(c) for c in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=CustomerRead, status_code=201)
def create_customer_endpoint(
    payload: CustomerCreate, session: Session = Depends(get_session)
) -> CustomerRead:
    customer = create_customer(session, payload)
    return CustomerRead.model_validate(customer)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer_endpoint(customer_id: int, session: Session = Depends(get_session)) -> CustomerRead:
    customer = get_customer(session, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerRead.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerRead)
def update_customer_endpoint(
    customer_id: int, payload: CustomerUpdate, session: Session = Depends(get_session)
) -> CustomerRead:
    customer = get_customer(session, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    updated = update_customer(session, customer, payload)
    return CustomerRead.model_validate(updated)


@router.patch("/{customer_id}/status", response_model=CustomerRead)
def update_customer_status_endpoint(
    customer_id: int, payload: StatusUpdateRequest, session: Session = Depends(get_session)
) -> CustomerRead:
    customer = get_customer(session, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    updated = set_customer_status(session, customer, payload)
    return CustomerRead.model_validate(updated)
