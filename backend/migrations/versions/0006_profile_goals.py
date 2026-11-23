"""Store the student's mission, goals and weekly time, and let a task belong to a goal."""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("profiles", sa.Column("mission", sa.String(500), nullable=True))
    op.add_column("profiles", sa.Column("time_budget", sa.JSON(), nullable=True))
    op.add_column(
        "profiles",
        sa.Column("goals", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    # SQLite cannot alter a column in place, so the batch rebuilds the table there.
    with op.batch_alter_table("study_tasks") as batch:
        batch.add_column(sa.Column("goal_id", sa.String(40), nullable=True))
        batch.alter_column("course_code", existing_type=sa.String(20), nullable=True)


def downgrade():
    # Goal-only tasks have no course; they cannot survive the older schema.
    op.execute("DELETE FROM study_tasks WHERE course_code IS NULL")
    with op.batch_alter_table("study_tasks") as batch:
        batch.alter_column("course_code", existing_type=sa.String(20), nullable=False)
        batch.drop_column("goal_id")
    op.drop_column("profiles", "goals")
    op.drop_column("profiles", "time_budget")
    op.drop_column("profiles", "mission")
