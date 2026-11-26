"""Add pinned courses and primary flag to plans, and allow goal-only focus sessions."""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("plans") as batch:
        batch.add_column(
            sa.Column("pinned", sa.JSON(), nullable=False, server_default=sa.text("'[]'"))
        )
        batch.add_column(
            sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false())
        )
    bind = op.get_bind()
    plans = sa.table(
        "plans",
        sa.column("id", sa.String),
        sa.column("profile_id", sa.String),
        sa.column("archived", sa.Boolean),
        sa.column("is_primary", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )
    rows = bind.execute(
        sa.select(plans.c.id, plans.c.profile_id)
        .where(plans.c.archived.is_(False))
        .order_by(plans.c.profile_id, plans.c.created_at, plans.c.id)
    ).all()
    seen_profiles: set[str] = set()
    primary_ids: list[str] = []
    for plan_id, profile_id in rows:
        if profile_id not in seen_profiles:
            seen_profiles.add(profile_id)
            primary_ids.append(plan_id)
    if primary_ids:
        bind.execute(sa.update(plans).where(plans.c.id.in_(primary_ids)).values(is_primary=True))
    with op.batch_alter_table("focus_sessions") as batch:
        batch.add_column(sa.Column("goal_id", sa.String(40), nullable=True))
        batch.alter_column("course_code", existing_type=sa.String(20), nullable=True)


def downgrade():
    # Goal-only focus sessions have no course code and cannot survive the older schema.
    op.execute("DELETE FROM focus_sessions WHERE course_code IS NULL")
    with op.batch_alter_table("focus_sessions") as batch:
        batch.alter_column("course_code", existing_type=sa.String(20), nullable=False)
        batch.drop_column("goal_id")
    with op.batch_alter_table("plans") as batch:
        batch.drop_column("is_primary")
        batch.drop_column("pinned")
