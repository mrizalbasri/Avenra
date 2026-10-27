"""Persist profiles, plans, study tasks, and focus sessions."""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "profiles",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("alias", sa.String(80), nullable=False),
        sa.Column("current_term", sa.Integer(), nullable=False),
        sa.Column("completed", sa.JSON(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
    )
    op.create_table(
        "plans",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("profile_id", sa.String(40), sa.ForeignKey("profiles.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("assignments", sa.JSON(), nullable=False),
        sa.Column("failed", sa.JSON(), nullable=False),
        sa.Column("credit_cap", sa.Integer(), nullable=False),
        sa.Column("horizon", sa.Integer(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("archived", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_plans_profile_id", "plans", ["profile_id"])
    op.create_table(
        "study_tasks",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("profile_id", sa.String(40), sa.ForeignKey("profiles.id"), nullable=False),
        sa.Column("course_code", sa.String(20), nullable=False),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("due_date", sa.String(10)),
        sa.Column("done", sa.Boolean(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_study_tasks_profile_id", "study_tasks", ["profile_id"])
    op.create_index("ix_study_tasks_course_code", "study_tasks", ["course_code"])
    op.create_table(
        "focus_sessions",
        sa.Column("id", sa.String(40), primary_key=True),
        sa.Column("profile_id", sa.String(40), sa.ForeignKey("profiles.id"), nullable=False),
        sa.Column("course_code", sa.String(20), nullable=False),
        sa.Column("seconds", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_focus_sessions_profile_id", "focus_sessions", ["profile_id"])


def downgrade():
    op.drop_table("focus_sessions")
    op.drop_table("study_tasks")
    op.drop_table("plans")
    op.drop_table("profiles")
