from alembic import context
from sqlalchemy import create_engine

from app.config import get_settings

target_metadata = None
url = get_settings().database_url
if not url:
    raise RuntimeError("Set DATABASE_URL before running migrations")

if context.is_offline_mode():
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
