"""Store a curriculum per student workspace."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("profiles", sa.Column("curriculum", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("profiles", "curriculum")
