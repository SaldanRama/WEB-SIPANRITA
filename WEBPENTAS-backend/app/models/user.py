from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('mahasiswa', 'admin', 'dekan', 'wakil_dekan'), nullable=False)
    create_at = db.Column(db.TIMESTAMP, nullable=False, server_default=db.func.current_timestamp())
    
    def __repr__(self):
        return f'<User {self.email}>' 