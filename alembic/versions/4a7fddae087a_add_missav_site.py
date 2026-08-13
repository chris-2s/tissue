"""add missav site

Revision ID: 4a7fddae087a
Revises: a8b9c0d1e2f3
Create Date: 2026-08-12 22:23:25.842792

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a7fddae087a'
down_revision: Union[str, None] = 'a8b9c0d1e2f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

site_table = sa.table(
    'site',
    sa.column('spider_key', sa.String),
    sa.column('priority', sa.Integer),
    sa.column('status', sa.Boolean),
    sa.column('language', sa.String),
)


def upgrade() -> None:
    op.bulk_insert(site_table, [
        {
            'spider_key': 'missav',
            'priority': 5,
            'status': None,
            'language': 'ja-JP',
        },
    ])


def downgrade() -> None:
    op.execute(site_table.delete().where(site_table.c.spider_key == 'missav'))
