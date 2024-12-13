"""Add selesai to status enum

Revision ID: 37cd4ff1cbdd
Revises: 3a78fa33eede
Create Date: 2024-12-05 20:06:43.055439

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '37cd4ff1cbdd'
down_revision = '3a78fa33eede'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.alter_column(
            'status',
            existing_type=sa.Enum('pending', 'disetujui', 'ditolak', 'disposisi'),
            type_=sa.Enum('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai'),
            existing_nullable=True
        )

def downgrade():
    with op.batch_alter_table('peminjaman', schema=None) as batch_op:
        batch_op.alter_column(
            'status',
            existing_type=sa.Enum('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai'),
            type_=sa.Enum('pending', 'disetujui', 'ditolak', 'disposisi'),
            existing_nullable=True
        )
