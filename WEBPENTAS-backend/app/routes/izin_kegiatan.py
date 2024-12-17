from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from app import db
from app.models.izin_kegiatan import IzinKegiatan
from app.models.disposisi_kegiatan import DisposisiKegiatan
from datetime import datetime
import os

izin_kegiatan_bp = Blueprint('izin_kegiatan', __name__)

# Konfigurasi upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Get semua izin kegiatan
@izin_kegiatan_bp.route('/izin-kegiatan', methods=['GET'])
def get_all_izin_kegiatan():
    try:
        result = []
        perizinan = IzinKegiatan.query.all()

        for izin in perizinan:
            disposisi = DisposisiKegiatan.query.filter_by(id_izin_kegiatan=izin.id).first()

            izin_data = {
                'id': izin.id,
                'nama_organisasi': izin.nama_organisasi,
                'penanggung_jawab': izin.penanggung_jawab,
                'keperluan': izin.keperluan,
                'tanggal_permintaan': izin.tanggal_permintaan.strftime('%Y-%m-%d %H:%M:%S'),
                'status': izin.status,
                'status_disposisi': disposisi.status_disposisi if disposisi else None
            }
            result.append(izin_data)

        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching izin kegiatan: {e}")
        return jsonify({"error": "Gagal mengambil data izin kegiatan"}), 500


# Get izin kegiatan by ID
@izin_kegiatan_bp.route('/izin-kegiatan/<int:id>', methods=['GET'])
def get_izin_kegiatan(id):
    try:
        izin = IzinKegiatan.query.get_or_404(id)
        print(f"Fetched izin: {izin}")  # Tambahkan log ini

        return jsonify({
            'id': izin.id,
            'nama_organisasi': izin.nama_organisasi,
            'penanggung_jawab': izin.penanggung_jawab,
            'kontak_pj': izin.kontak_pj,
            'email': izin.email,
            'keperluan': izin.keperluan,
            'status': izin.status,
            'surat_perizinan': izin.surat_perizinan,
            'tanggal_permintaan': izin.tanggal_permintaan.strftime('%Y-%m-%d %H:%M:%S')
        })
    except Exception as e:
        print(f"Error: {e}")  # Cetak error detail
        return jsonify({'error': str(e)}), 500


# Tambah izin kegiatan baru
@izin_kegiatan_bp.route('/izin-kegiatan', methods=['POST'])
def add_izin_kegiatan():
    try:
        # Validasi input
        if 'surat_perizinan' not in request.files:
            return jsonify({'error': 'Surat perizinan harus diupload'}), 400
            
        data = request.form
        required_fields = [
            'id_user', 'nama_organisasi', 'penanggung_jawab', 'kontak_pj', 
            'email', 'keperluan'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} harus diisi'}), 400
        
        # Proses file
        file = request.files['surat_perizinan']
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
            
        # Validasi ekstensi file (misalnya hanya PDF, jpg, png)
        allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png'}
        filename = secure_filename(file.filename)
        if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'error': 'File harus berformat PDF atau gambar'}), 400

        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Buat izin kegiatan baru
        new_izin = IzinKegiatan(
            id_user=data['id_user'],
            nama_organisasi=data['nama_organisasi'],
            penanggung_jawab=data['penanggung_jawab'],
            kontak_pj=data['kontak_pj'],
            email=data['email'],
            keperluan=data['keperluan'],
            surat_perizinan=filename,
        )
        
        db.session.add(new_izin)
        db.session.commit()
        
        return jsonify({
            'message': 'Izin kegiatan berhasil ditambahkan',
            'data': {
                'id': new_izin.id,
                'nama_organisasi': new_izin.nama_organisasi,
                'status': new_izin.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': str(e),
            'message': 'Gagal menambahkan izin kegiatan'
        }), 500


# Update status izin kegiatan
@izin_kegiatan_bp.route('/izin-kegiatan/<int:id>/status', methods=['PUT'])
def update_status(id):
    try:
        # Ambil data izin kegiatan berdasarkan ID
        izin = IzinKegiatan.query.get_or_404(id)
        data = request.get_json()

        # Pastikan status ada dalam data yang dikirimkan
        if 'status' not in data:
            return jsonify({
                'error': 'Status harus diisi'
            }), 400

        # Validasi status yang diperbolehkan
        allowed_status = ['pending', 'disetujui', 'ditolak', 'disposisi', 'selesai']
        status = data['status'].lower()  # Menjamin validasi status dalam format lowercase
        if status not in allowed_status:
            return jsonify({
                'error': f'Status harus salah satu dari: {", ".join(allowed_status)}'
            }), 400

        # Update status izin kegiatan
        izin.status = status

        # Jika ada komentar, simpan juga komentar tersebut
        if 'komentar' in data:
            izin.komentar = data['komentar']

        db.session.commit()  # Simpan perubahan status dan komentar dalam satu transaksi

        return jsonify({
            'message': 'Status izin kegiatan berhasil diupdate',
            'data': {
                'id': izin.id,
                'status': izin.status,  # Status dikirim sebagai string
                'komentar': izin.komentar  # Komentar (jika ada)
            }
        }), 200

    except Exception as e:
        db.session.rollback()  # Rollback transaksi jika ada error
        return jsonify({
            'error': str(e),
            'message': 'Gagal mengupdate status izin kegiatan'
        }), 500


# Get izin kegiatan by user
@izin_kegiatan_bp.route('/izin-kegiatan/user/<int:user_id>', methods=['GET'])
def get_izin_kegiatan_by_user(user_id):
    try:
        izin_kegiatan = IzinKegiatan.query.filter_by(id_user=user_id).all()
        
        result = []
        for izin in izin_kegiatan:
            result.append({
                'id': izin.id,
                'nama_organisasi': izin.nama_organisasi,
                'tanggal_permintaan': izin.tanggal_permintaan.strftime('%Y-%m-%d'),
                'status': izin.status.value,
                'keperluan': izin.keperluan,
                'komentar': izin.komentar
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get izin kegiatan by email
@izin_kegiatan_bp.route('/izin-kegiatan/user/<string:email>', methods=['GET'])
def get_user_izin_kegiatan(email):
    try:
        # Ambil semua izin kegiatan user berdasarkan email
        user_izin_kegiatan = IzinKegiatan.query.filter_by(email=email).all()
        
        result = []
        for izin in user_izin_kegiatan:
            result.append({
                'id': izin.id,
                'nama_organisasi': izin.nama_organisasi,
                'keperluan': izin.keperluan,
                'status': izin.status,
                'komentar': izin.komentar,
                'tanggal_permintaan': izin.tanggal_permintaan.strftime('%Y-%m-%d %H:%M:%S')
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint untuk mengunduh surat perizinan
@izin_kegiatan_bp.route('/uploads/<path:filename>', methods=['GET'])
def get_uploaded_file(filename):
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        upload_path = os.path.join(current_dir, '../../uploads')
        
        if os.path.exists(os.path.join(upload_path, filename)):
            return send_from_directory(upload_path, filename)
        else:
            return jsonify({'error': 'File tidak ditemukan'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
