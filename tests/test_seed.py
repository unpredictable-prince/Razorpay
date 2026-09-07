from app.database import SessionLocal, init_db
from app.models import Transaction
from database.seed import seed_database


def test_seed_database_idempotency():
    init_db()
    seed_database()
    db = SessionLocal()
    count_after_first_seed = db.query(Transaction).count()
    assert count_after_first_seed >= 10

    # Re-run seed to test idempotency
    seed_database()
    count_after_second_seed = db.query(Transaction).count()
    assert count_after_second_seed == count_after_first_seed
    db.close()
