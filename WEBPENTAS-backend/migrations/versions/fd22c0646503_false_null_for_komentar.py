"""False  NULL for komentar

Revision ID: fd22c0646503
Revises: 018b504735a6
Create Date: 2024-12-06 03:30:55.938612

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'fd22c0646503'
down_revision = '018b504735a6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.alter_column('komentar',
               existing_type=mysql.TEXT(),
               nullable=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.alter_column('komentar',
               existing_type=mysql.TEXT(),
               nullable=False)

    # ### end Alembic commands ###