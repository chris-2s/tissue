"""添加刮削元数据优先级表

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-06-25 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'metadata_priority',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('field_key', sa.String(), nullable=False),
        sa.Column('spider_key', sa.String(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('create_by', sa.Integer(), nullable=True),
        sa.Column('create_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('update_by', sa.Integer(), nullable=True),
        sa.Column('update_time', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('field_key', 'spider_key', name='uq_metadata_priority_field_spider'),
    )


def downgrade() -> None:
    op.drop_table('metadata_priority')
