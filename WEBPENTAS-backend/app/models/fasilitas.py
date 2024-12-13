from app import db
from datetime import datetime

class Fasilitas(db.Model):
    __tablename__ = 'fasilitas'
    
    id = db.Column(db.Integer, primary_key=True)
    nama_fasilitas = db.Column(db.String(255), nullable=False)
    image = db.Column(db.String(255))
    image2 = db.Column(db.String(255))
    image3 = db.Column(db.String(255))
    kapasitas = db.Column(db.Integer)
    gedung = db.Column(db.String(100))  # Kolom untuk Gedung
    lantai = db.Column(db.String(100))  # Kolom untuk Lantai
    created_at = db.Column(db.TIMESTAMP, default=datetime.utcnow)

    def __repr__(self):
        return f'<Fasilitas {self.nama_fasilitas}>'
