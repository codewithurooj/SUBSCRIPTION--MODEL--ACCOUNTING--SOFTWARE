from concurrent.futures import ThreadPoolExecutor

from sqlmodel import Session

from src.services.customer_service import generate_customer_code


def test_concurrent_customer_code_generation_never_produces_a_duplicate(engine):
    """FR-007: customer_code must stay unique even under concurrent creates.

    Uses the session-scoped `engine` fixture directly (not `db_session`,
    which wraps a single connection in one rolled-back transaction and can't
    be shared safely across threads) — each worker opens its own connection,
    exactly like independent concurrent HTTP requests would.
    """

    def worker() -> str:
        with Session(engine) as session:
            return generate_customer_code(session)

    with ThreadPoolExecutor(max_workers=10) as executor:
        codes = list(executor.map(lambda _: worker(), range(20)))

    assert len(codes) == len(set(codes)), "duplicate customer_code generated under concurrency"
