"""add api_key table

Revision ID: b2c13f4e90ab
Revises: 6c9f20f3c1ab
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c13f4e90ab'
down_revision: Union[str, None] = '6c9f20f3c1ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'api_key',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('api_key', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('create_by', sa.Integer(), nullable=True),
        sa.Column('create_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('update_by', sa.Integer(), nullable=True),
        sa.Column('update_time', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_key_api_key'), 'api_key', ['api_key'], unique=True)
    op.create_index(op.f('ix_api_key_enabled'), 'api_key', ['enabled'], unique=False)
    op.create_index(op.f('ix_api_key_user_id'), 'api_key', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_api_key_user_id'), table_name='api_key')
    op.drop_index(op.f('ix_api_key_enabled'), table_name='api_key')
    op.drop_index(op.f('ix_api_key_api_key'), table_name='api_key')
    op.drop_table('api_key')
