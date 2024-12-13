from werkzeug.security import generate_password_hash
from app.models.user import User
from app import db

def create_initial_data(app):
    with app.app_context():
        # Buat tabel
        db.create_all()
        
        # Cek apakah sudah ada data
        if User.query.first() is None:
            # Buat user admin
            admin = User(
                username='admin1',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            
            # Buat user dekan
            dekan = User(
                username='dekan1',
                password=generate_password_hash('dekan123'),
                role='dekan'
            )
            
            # Buat user wakil dekan
            wakil_dekan = User(
                username='wakildekan',
                password=generate_password_hash('wd123'),
                role='wakil_dekan'
            )
            
            # Buat user mahasiswa
            mhs_user = User(
                username='mhs1',
                password=generate_password_hash('mhs123'),
                role='mahasiswa'
            )
            
            db.session.add_all([admin, dekan, wakil_dekan, mhs_user])
            db.session.commit()
            
        
            db.session.commit() 