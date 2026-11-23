"""Add planned start date, first concrete step, and extracted details to study tasks."""

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("study_tasks") as batch:
        batch.add_column(sa.Column("start_date", sa.String(10), nullable=True))
        batch.add_column(sa.Column("first_step", sa.String(250), nullable=True))
        batch.add_column(
            sa.Column("details", sa.JSON(), nullable=False, server_default=sa.text("'[]'"))
        )


def downgrade():
    with op.batch_alter_table("study_tasks") as batch:
        batch.drop_column("details")
        batch.drop_column("first_step")
        batch.drop_column("start_date")
