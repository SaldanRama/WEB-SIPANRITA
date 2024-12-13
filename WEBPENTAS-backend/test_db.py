from app import create_app, db
from sqlalchemy import text
from app.models.fasilitas import Fasilitas

app = create_app()

with app.app_context():
    try:
        # Test koneksi database
        connection = db.engine.connect()
        print("Koneksi database berhasil!")
        
        # Tambah kolom baru ke tabel fasilitas
        with connection.begin():
            connection.execute(text("ALTER TABLE fasilitas ADD COLUMN IF NOT EXISTS image2 VARCHAR(255)"))
            connection.execute(text("ALTER TABLE fasilitas ADD COLUMN IF NOT EXISTS image3 VARCHAR(255)"))
            print("Kolom image2 dan image3 berhasil ditambahkan!")
            
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        connection.close() 