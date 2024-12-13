import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost/db_pentas'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USERNAME = 'mailpentas24@gmail.com'
    MAIL_PASSWORD = 'dvrt ksws encv xnew'
    MAIL_USE_TLS = True
    MAIL_DEFAULT_SENDER = 'mailpentas24@gmail.com'
    SECRET_KEY = 'dev-key-rahasia'
    
    # Konfigurasi upload
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'fasilitas')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Max 16MB
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}