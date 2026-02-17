"""add site cookies

Revision ID: 401f9a6466ee
Revises: 7c9ba4d939cf
Create Date: 2026-02-17 22:21:54.058663

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '401f9a6466ee'
down_revision: Union[str, None] = '7c9ba4d939cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('site', sa.Column('cookies', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('site', 'cookies')
