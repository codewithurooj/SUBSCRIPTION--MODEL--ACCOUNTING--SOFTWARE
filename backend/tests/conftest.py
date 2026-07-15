"""Shared pytest fixtures.

Tests run against a real Postgres database (DATABASE_URL_TEST), never SQLite —
see research.md #5: NUMERIC precision, the customer_code sequence, and ILIKE
substring search all need real Postgres semantics to be tested faithfully.

Each test runs inside a transaction that is rolled back afterward, so tests
never see each other's data and the test database stays empty between runs.
"""

import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from sqlalchemy import event
from sqlmodel import Session, create_engine

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

TEST_DATABASE_URL = os.environ["DATABASE_URL_TEST"]

# Schema is created by real Alembic migrations against DATABASE_URL_TEST
# (`alembic upgrade head`, run with DATABASE_URL=$DATABASE_URL_TEST), not
# SQLModel.metadata.create_all() — the sequence, partial unique index, and
# CHECK constraints only exist in the migration, and Postgres sequences are
# non-transactional so they must be real objects, not metadata-derived ones.


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DATABASE_URL)
    yield eng
    eng.dispose()


@pytest.fixture()
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    # Nested SAVEPOINT so code under test can call session.commit() freely;
    # the outer transaction (and therefore all writes) is still rolled back here.
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
