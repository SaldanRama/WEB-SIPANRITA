from app import db
from datetime import datetime

class Disposisi(db.Model):
    __tablename__ = 'disposisi'
    
    id = db.Column(db.Integer, primary_key=True)
    id_peminjaman = db.Column(db.Integer, db.ForeignKey('peminjaman.id'), nullable=False)
    dari = db.Column(db.Enum('dekan', 'wakil_dekan'), nullable=False)
    kepada = db.Column(db.Enum('dekan', 'wakil_dekan'), nullable=False)
    status_disposisi = db.Column(db.Enum('pending', 'disetujui', 'ditolak'), default='pending')
    catatan = db.Column(db.Text)
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    # Relasi ke tabel peminjaman
    peminjaman = db.relationship('Peminjaman', backref='disposisi')

    def __repr__(self):
        return f'<Disposisi {self.id}>' 