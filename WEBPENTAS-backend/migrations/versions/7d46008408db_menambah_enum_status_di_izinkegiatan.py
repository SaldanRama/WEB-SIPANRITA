"""Menambah enum status di IzinKegiatan

Revision ID: 7d46008408db
Revises: c82552a8212b
Create Date: 2024-12-15 18:39:35.424051

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d46008408db'
down_revision = 'c82552a8212b'
branch_labels = None
depends_on = None


# Menggunakan tipe enum yang sesuai dengan database MySQL/MariaDB
def upgrade():
    op.create_table(
        'izin_kegiatan',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('id_user', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('nama_organisasi', sa.String(255), nullable=False),
        sa.Column('penanggung_jawab', sa.String(255), nullable=False),
        sa.Column('kontak_pj', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('keperluan', sa.String(255), nullable=False),
        sa.Column('surat_perizinan', sa.String(255), nullable=False),
        sa.Column('status', sa.Enum('pending', 'disetujui', 'ditolak', 'disposisi', 'selesai', name='statusenum'), nullable=False, default='pending'),
        sa.Column('komentar', sa.String(255), nullable=True),
        sa.Column('disposisi_wakil_dekan1', sa.Boolean, default=False),
        sa.Column('tanggal_permintaan', sa.TIMESTAMP, server_default=sa.func.current_timestamp(), nullable=False),
    )


def downgrade():
    op.drop_column('izin_kegiatan', 'status')
    op.execute("DROP TYPE statusenum")
