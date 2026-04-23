"""add gaytorrents site

Revision ID: a1b2c3d4e5f6
Revises: 6c9f20f3c1ab
Create Date: 2026-04-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6c9f20f3c1ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

site_table = sa.table('site', sa.column('spider_key', sa.String), sa.column('priority', sa.Integer))


def upgrade() -> None:
    op.bulk_insert(site_table, [
        {'spider_key': 'gaytorrents', 'priority': 5},
    ])


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM site WHERE spider_key = 'gaytorrents'"))
