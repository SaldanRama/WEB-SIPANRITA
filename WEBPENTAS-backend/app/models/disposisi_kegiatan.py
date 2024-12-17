from app import db
from datetime import datetime

class DisposisiKegiatan(db.Model):
    __tablename__ = 'disposisi_kegiatan'

    id = db.Column(db.Integer, primary_key=True)
    id_izin_kegiatan = db.Column(db.Integer, db.ForeignKey('izin_kegiatan.id'), nullable=False)  # Hubungkan dengan tabel izin_kegiatan
    dari = db.Column(db.Enum('dekan', 'wakil_dekan1'), nullable=False)
    kepada = db.Column(db.Enum('dekan', 'wakil_dekan1'), nullable=False)
    status_disposisi = db.Column(db.Enum('pending', 'disetujui', 'ditolak'), default='pending')
    komentar = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relasi ke tabel izin_kegiatan
    izin_kegiatan = db.relationship('IzinKegiatan', backref='disposisi_kegiatan')

    def __repr__(self):
        return f'<DisposisiKegiatan {self.id}>'
