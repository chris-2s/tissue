"""migrate site class_str to spider_key

Revision ID: 6c9f20f3c1ab
Revises: 401f9a6466ee
Create Date: 2026-02-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c9f20f3c1ab'
down_revision: Union[str, None] = '401f9a6466ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CLASS_TO_KEY = {
    'JavDBSpider': 'javdb',
    'JavBusSpider': 'javbus',
    'Jav321Spider': 'jav321',
    'DmmSpider': 'dmm',
}

KEY_TO_CLASS = {value: key for key, value in CLASS_TO_KEY.items()}


def upgrade() -> None:
    with op.batch_alter_table('site') as batch_op:
        batch_op.add_column(sa.Column('spider_key', sa.String(), nullable=True))

    for class_str, spider_key in CLASS_TO_KEY.items():
        op.execute(
            sa.text(
                "UPDATE site SET spider_key = :spider_key WHERE class_str = :class_str"
            ).bindparams(spider_key=spider_key, class_str=class_str)
        )

    op.execute(sa.text("UPDATE site SET spider_key = class_str WHERE spider_key IS NULL"))

    with op.batch_alter_table('site') as batch_op:
        batch_op.alter_column('spider_key', existing_type=sa.String(), nullable=False)
        batch_op.drop_column('class_str')


def downgrade() -> None:
    with op.batch_alter_table('site') as batch_op:
        batch_op.add_column(sa.Column('class_str', sa.String(), nullable=True))

    for spider_key, class_str in KEY_TO_CLASS.items():
        op.execute(
            sa.text(
                "UPDATE site SET class_str = :class_str WHERE spider_key = :spider_key"
            ).bindparams(class_str=class_str, spider_key=spider_key)
        )

    op.execute(sa.text("UPDATE site SET class_str = spider_key WHERE class_str IS NULL"))

    with op.batch_alter_table('site') as batch_op:
        batch_op.alter_column('class_str', existing_type=sa.String(), nullable=False)
        batch_op.drop_column('spider_key')
