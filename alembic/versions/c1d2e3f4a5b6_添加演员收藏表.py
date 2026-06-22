"""添加演员收藏表

Revision ID: c1d2e3f4a5b6
Revises: b2c13f4e90ab
Create Date: 2026-06-22 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'b2c13f4e90ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'actor_favorite',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('site_id', sa.Integer(), nullable=False),
        sa.Column('actor_code', sa.String(), nullable=False),
        sa.Column('actor_name', sa.String(), nullable=True),
        sa.Column('actor_thumb', sa.String(), nullable=True),
        sa.Column('actor_alias', sa.Text(), nullable=True),
        sa.Column('create_by', sa.Integer(), nullable=True),
        sa.Column('create_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('update_by', sa.Integer(), nullable=True),
        sa.Column('update_time', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('site_id', 'actor_code', name='uq_actor_favorite_site_code'),
    )


def downgrade() -> None:
    op.drop_table('actor_favorite')
