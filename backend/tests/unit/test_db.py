from sqlmodel import Session

import src.core.db as db_module


def test_get_session_yields_a_working_session(monkeypatch, engine):
    monkeypatch.setattr(db_module, "engine", engine)

    gen = db_module.get_session()
    session = next(gen)
    try:
        assert isinstance(session, Session)
        assert session.connection() is not None
    finally:
        gen.close()
