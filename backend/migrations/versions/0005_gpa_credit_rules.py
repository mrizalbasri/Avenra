"""Store the last-term GPA (IPS) and a per-plan scenario GPA for credit limits."""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("profiles", sa.Column("last_gpa", sa.Float(), nullable=True))
    op.add_column("plans", sa.Column("expected_gpa", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("plans", "expected_gpa")
    op.drop_column("profiles", "last_gpa")
