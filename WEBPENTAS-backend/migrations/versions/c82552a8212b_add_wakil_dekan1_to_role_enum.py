"""Add wakil_dekan1 to role enum

Revision ID: c82552a8212b
Revises: 247ca0351421
Create Date: 2024-12-15 18:00:20.297009

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c82552a8212b'
down_revision = '247ca0351421'
branch_labels = None
depends_on = None


def upgrade():
    # Ubah ENUM di MariaDB (MySQL) dengan 'ALTER TABLE'
    op.execute("""
        ALTER TABLE users MODIFY role ENUM('mahasiswa', 'admin', 'dekan', 'wakil_dekan', 'wakil_dekan1') NOT NULL;
    """)

def downgrade():
    # Kembali ke ENUM sebelumnya jika downgrade diperlukan
    op.execute("""
        ALTER TABLE users MODIFY role ENUM('mahasiswa', 'admin', 'dekan', 'wakil_dekan') NOT NULL;
    """)
