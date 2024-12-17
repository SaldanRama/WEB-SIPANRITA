"""Menghapus kolom disposisi_wakil_dekan1 dan menambah tabel disposisi_kegiatan

Revision ID: 36b3dc777041
Revises: 7d46008408db
Create Date: 2024-12-15 18:51:45.610452

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '36b3dc777041'
down_revision = '7d46008408db'
branch_labels = None
depends_on = None


def upgrade():
    # Menghapus kolom disposisi_wakil_dekan1 dari tabel izin_kegiatan
    op.drop_column('izin_kegiatan', 'disposisi_wakil_dekan1')

    # Membuat tabel disposisi_kegiatan
    op.create_table(
        'disposisi_kegiatan',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('id_izin_kegiatan', sa.Integer, sa.ForeignKey('izin_kegiatan.id'), nullable=False),
        sa.Column('dari', sa.Enum('dekan', 'wakil_dekan1'), nullable=False),
        sa.Column('kepada', sa.Enum('dekan', 'wakil_dekan1'), nullable=False),
        sa.Column('status_disposisi', sa.Enum('pending', 'disetujui', 'ditolak'), default='pending'),
        sa.Column('komentar', sa.Text),
        sa.Column('created_at', sa.TIMESTAMP, default=datetime.utcnow)
    )


def downgrade():
    # Menambahkan kembali kolom disposisi_wakil_dekan1 ke tabel izin_kegiatan
    op.add_column('izin_kegiatan', sa.Column('disposisi_wakil_dekan1', sa.Boolean, default=False))

    # Menghapus tabel disposisi_kegiatan jika rollback
    op.drop_table('disposisi_kegiatan')

    # ### end Alembic commands ###
