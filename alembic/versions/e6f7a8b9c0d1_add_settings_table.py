"""add settings table

Revision ID: e6f7a8b9c0d1
Revises: d4e5f6a7b8c9
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('namespace', sa.String(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('payload', sa.Text(), nullable=False),
        sa.Column('create_by', sa.Integer(), nullable=True),
        sa.Column('create_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('update_by', sa.Integer(), nullable=True),
        sa.Column('update_time', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('namespace', name='uq_settings_namespace'),
    )


def downgrade() -> None:
    op.drop_table('settings')
