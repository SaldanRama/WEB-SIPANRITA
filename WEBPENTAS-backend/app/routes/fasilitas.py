from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.fasilitas import Fasilitas
from app.models.peminjaman import Peminjaman
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from sqlalchemy import text


fasilitas_bp = Blueprint('fasilitas', __name__)

# Tambahkan konfigurasi upload
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Get semua fasilitas
@fasilitas_bp.route('/fasilitas', methods=['GET'])
def get_all_fasilitas():
    try:
        fasilitas = Fasilitas.query.all()
        return jsonify([{
            'id': f.id,
            'nama_fasilitas': f.nama_fasilitas,
            'image': f.image,
            'image2': f.image2,
            'image3': f.image3,
            'kapasitas': f.kapasitas,
            'gedung': f.gedung,  # Menambahkan kolom gedung
            'lantai': f.lantai,  # Menambahkan kolom lantai
            'created_at': f.created_at
        } for f in fasilitas])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get fasilitas by ID
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['GET'])
def get_fasilitas(id):
    try:
        fasilitas = Fasilitas.query.get_or_404(id)
        return jsonify({
            'id': fasilitas.id,
            'nama_fasilitas': fasilitas.nama_fasilitas,
            'image': fasilitas.image,
            'image2': fasilitas.image2,
            'image3': fasilitas.image3,
            'kapasitas': fasilitas.kapasitas,
            'gedung': fasilitas.gedung,  
            'lantai': fasilitas.lantai,  
            'created_at': fasilitas.created_at
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Tambah fasilitas baru
@fasilitas_bp.route('/fasilitas', methods=['POST'])
def add_fasilitas():
    try:
        data = request.form
        
        # Ambil file gambar dari request
        image1 = request.files.get('image1')
        image2 = request.files.get('image2')
        image3 = request.files.get('image3')
        
        filenames = []
        
        # Fungsi untuk generate unique filename
        def get_unique_filename(original_filename):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            name, ext = os.path.splitext(original_filename)
            return f"{name}_{timestamp}{ext}"
        
        # Proses setiap gambar
        for img in [image1, image2, image3]:
            if img and allowed_file(img.filename):
                unique_filename = get_unique_filename(secure_filename(img.filename))
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                img.save(file_path)
                filenames.append(unique_filename)
            else:
                filenames.append(None)
                
        new_fasilitas = Fasilitas(
            nama_fasilitas=data['nama_fasilitas'],
            kapasitas=data['kapasitas'],
            gedung=data['gedung'],  # Menambahkan kolom gedung
            lantai=data['lantai'],  # Menambahkan kolom lantai
            image=filenames[0],
            image2=filenames[1],
            image3=filenames[2]
        )
        
        db.session.add(new_fasilitas)
        db.session.commit()
        
        return jsonify({
            'message': 'Fasilitas berhasil ditambahkan',
            'id': new_fasilitas.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update fasilitas
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['PUT'])
def update_fasilitas(id):
    try:
        fasilitas = Fasilitas.query.get_or_404(id)
        data = request.form
        
        # Update data teks
        fasilitas.nama_fasilitas = data['nama_fasilitas']
        fasilitas.kapasitas = data['kapasitas']
        fasilitas.gedung = data['gedung']  # Menambahkan update untuk gedung
        fasilitas.lantai = data['lantai']  # Menambahkan update untuk lantai
        
        # Fungsi untuk generate unique filename
        def get_unique_filename(original_filename):
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            name, ext = os.path.splitext(original_filename)
            return f"{name}_{timestamp}{ext}"
        
        # Update gambar jika ada
        for i, field in enumerate(['image1', 'image2', 'image3']):
            file = request.files.get(field)
            if file and allowed_file(file.filename):
                # Hapus file lama jika ada
                old_image = getattr(fasilitas, f'image{i+1 if i > 0 else ""}')
                if old_image:
                    old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], old_image)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                # Simpan file baru
                unique_filename = get_unique_filename(secure_filename(file.filename))
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                
                # Update database
                if i == 0:
                    fasilitas.image = unique_filename
                elif i == 1:
                    fasilitas.image2 = unique_filename
                else:
                    fasilitas.image3 = unique_filename
        
        db.session.commit()
        
        return jsonify({
            'message': 'Fasilitas berhasil diupdate',
            'id': fasilitas.id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Hapus fasilitas
@fasilitas_bp.route('/fasilitas/<int:id>', methods=['DELETE'])
def delete_fasilitas(id):
    try:
        # Cek apakah fasilitas digunakan di tabel peminjaman menggunakan ORM
        peminjaman_check = db.session.query(Peminjaman).filter(Peminjaman.id_fasilitas == id).count()

        # Jika ada peminjaman terkait, blokir penghapusan
        if peminjaman_check > 0:
            return jsonify({
                'error': 'Fasilitas tidak dapat dihapus karena sedang digunakan dalam peminjaman'
            }), 400

        # Jika tidak ada peminjaman, lanjutkan dengan penghapusan fasilitas
        fasilitas = Fasilitas.query.get_or_404(id)

        # Hapus gambar jika ada
        if fasilitas.image:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], fasilitas.image)
            if os.path.exists(file_path):
                os.remove(file_path)
        if fasilitas.image2:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], fasilitas.image2)
            if os.path.exists(file_path):
                os.remove(file_path)
        if fasilitas.image3:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], fasilitas.image3)
            if os.path.exists(file_path):
                os.remove(file_path)

        # Hapus fasilitas
        db.session.delete(fasilitas)
        db.session.commit()

        return jsonify({'message': 'Fasilitas berhasil dihapus'})

    except Exception as e:
        db.session.rollback()
        print(f"Error saat menghapus fasilitas: {str(e)}")  # Tambahkan log error
        return jsonify({'error': 'Terjadi kesalahan saat menghapus fasilitas'}), 500