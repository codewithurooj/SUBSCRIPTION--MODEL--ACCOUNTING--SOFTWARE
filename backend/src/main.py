from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.api.routes.customers import router as customers_router
from src.services.customer_service import DuplicateTaxRegistrationError

app = FastAPI(title="Subscription Model Backend")

app.include_router(customers_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # The API contract (contracts/customers-api.openapi.yaml) specifies 400
    # for validation errors, not FastAPI's default 422.
    errors = [
        {"field": ".".join(str(p) for p in err["loc"][1:]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": errors})


@app.exception_handler(DuplicateTaxRegistrationError)
async def duplicate_tax_registration_handler(
    request: Request, exc: DuplicateTaxRegistrationError
) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
