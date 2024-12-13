from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from app import db
from app.models.peminjaman import Peminjaman
from app.models.fasilitas import Fasilitas
from app.models.disposisi import Disposisi
from datetime import datetime
import os

peminjaman_bp = Blueprint('peminjaman', __name__)

# Konfigurasi upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Get semua peminjaman
@peminjaman_bp.route('/peminjaman', methods=['GET'])
def get_all_peminjaman():
    try:
        result = []
        peminjaman_list = Peminjaman.query.all()
        
        for p in peminjaman_list:
            # Cari disposisi terkait
            disposisi = Disposisi.query.filter_by(id_peminjaman=p.id).first()
            fasilitas = Fasilitas.query.get(p.id_fasilitas)
            
            peminjaman_data = {
                'id': p.id,
                'nama_organisasi': p.nama_organisasi,
                'penanggung_jawab': p.penanggung_jawab,
                'nama_fasilitas': fasilitas.nama_fasilitas if fasilitas else None,
                'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
                'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
                'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
                'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
                'status': p.status,
                'status_disposisi': disposisi.status_disposisi if disposisi else None
            }
            result.append(peminjaman_data)
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get peminjaman by ID
@peminjaman_bp.route('/peminjaman/<int:id>', methods=['GET'])
def get_peminjaman(id):
    try:
        peminjaman = Peminjaman.query.get_or_404(id)
        fasilitas = Fasilitas.query.get(peminjaman.id_fasilitas)
        
        return jsonify({
            'id': peminjaman.id,
            'nama_organisasi': peminjaman.nama_organisasi,
            'penanggung_jawab': peminjaman.penanggung_jawab,
            'kontak_pj': peminjaman.kontak_pj,
            'email': peminjaman.email,
            'nama_fasilitas': fasilitas.nama_fasilitas if fasilitas else None,
            'tanggal_mulai': peminjaman.tanggal_mulai.strftime('%Y-%m-%d'),
            'tanggal_selesai': peminjaman.tanggal_selesai.strftime('%Y-%m-%d'),
            'waktu_mulai': peminjaman.waktu_mulai.strftime('%H:%M'),
            'waktu_selesai': peminjaman.waktu_selesai.strftime('%H:%M'),
            'keperluan': peminjaman.keperluan,
            'status': peminjaman.status,
            'surat_peminjaman': peminjaman.surat_peminjaman
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Tambah peminjaman baru
@peminjaman_bp.route('/peminjaman', methods=['POST'])
def add_peminjaman():
    try:
        # Validasi input
        if 'surat_peminjaman' not in request.files:
            return jsonify({'error': 'Surat peminjaman harus diupload'}), 400
            
        data = request.form
        required_fields = [
            'id_user', 'id_fasilitas', 'nama_organisasi', 
            'tanggal_mulai', 'tanggal_selesai', 'waktu_mulai', 
            'waktu_selesai', 'penanggung_jawab', 'kontak_pj', 
            'keperluan', 'email'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} harus diisi'}), 400
        
        # Proses file
        file = request.files['surat_peminjaman']
        if file.filename == '':
            return jsonify({'error': 'Tidak ada file yang dipilih'}), 400
            
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Buat peminjaman baru
        new_peminjaman = Peminjaman(
            id_user=data['id_user'],
            id_fasilitas=data['id_fasilitas'],
            nama_organisasi=data['nama_organisasi'],
            tanggal_mulai=datetime.strptime(data['tanggal_mulai'], '%Y-%m-%d').date(),
            tanggal_selesai=datetime.strptime(data['tanggal_selesai'], '%Y-%m-%d').date(),
            waktu_mulai=datetime.strptime(data['waktu_mulai'], '%H:%M').time(),
            waktu_selesai=datetime.strptime(data['waktu_selesai'], '%H:%M').time(),
            penanggung_jawab=data['penanggung_jawab'],
            kontak_pj=data['kontak_pj'],
            keperluan=data['keperluan'],
            email=data['email'],
            surat_peminjaman=filename,
        )
        
        db.session.add(new_peminjaman)
        db.session.commit()
        
        return jsonify({
            'message': 'Peminjaman berhasil ditambahkan',
            'data': {
                'id': new_peminjaman.id,
                'nama_organisasi': new_peminjaman.nama_organisasi,
                'status': new_peminjaman.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': str(e),
            'message': 'Gagal menambahkan peminjaman'
        }), 500

# Update status peminjaman
@peminjaman_bp.route('/peminjaman/<int:id>/status', methods=['PUT', 'POST'])
def update_status(id):
    try:
        peminjaman = Peminjaman.query.get_or_404(id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({
                'error': 'Status harus diisi'
            }), 400
            
        # Validasi status yang diperbolehkan
        allowed_status = ['pending', 'disposisi', 'disetujui', 'ditolak', 'selesai']
        if data['status'] not in allowed_status:
            return jsonify({
                'error': f'Status harus salah satu dari: {", ".join(allowed_status)}'
            }), 400
        
        # Update status
        peminjaman.status = data['status']
        
        # Jika ada komentar, simpan komentar
        if 'komentar' in data:
            peminjaman.komentar = data['komentar']

        db.session.commit()
        
        return jsonify({
            'message': 'Status peminjaman berhasil diupdate',
            'data': {
                'id': peminjaman.id,
                'status': peminjaman.status,
                'komentar': peminjaman.komentar  # Kirim komentar dalam response
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': str(e),
            'message': 'Gagal mengupdate status peminjaman'
        }), 500


@peminjaman_bp.route('/peminjaman/fasilitas/<int:id_fasilitas>', methods=['GET'])
def get_peminjaman_by_fasilitas(id_fasilitas):
    try:
        peminjaman = Peminjaman.query.filter_by(
            id_fasilitas=id_fasilitas,
            status='disetujui'  # Hanya tampilkan yang sudah disetujui
        ).all()
        
        return jsonify([{
            'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
            'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
            'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
            'waktu_selesai': p.waktu_selesai.strftime('%H:%M')
        } for p in peminjaman])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@peminjaman_bp.route('/uploads/<path:filename>', methods=['GET'])
def get_uploaded_file(filename):
    try:
        # Menggunakan path absolut untuk folder uploads
        current_dir = os.path.dirname(os.path.abspath(__file__))
        upload_path = os.path.join(current_dir, '../../uploads')
        if os.path.exists(os.path.join(upload_path, filename)):
            return send_from_directory(upload_path, filename)
        else:
            return jsonify({'error': 'File tidak ditemukan'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@peminjaman_bp.route('/peminjaman/user/<int:user_id>', methods=['GET'])
def get_peminjaman_by_user(user_id):
    try:
        peminjaman = Peminjaman.query.filter_by(user_id=user_id).all()
        
        result = []
        for p in peminjaman:
            fasilitas = Fasilitas.query.get(p.id_fasilitas)
            if fasilitas:
                result.append({
                    'id': p.id,
                    'nama_fasilitas': fasilitas.nama_fasilitas,
                    'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
                    'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
                    'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
                    'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
                    'status': p.status,
                    'keperluan': p.keperluan,
                    'komentar': p.komentar
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@peminjaman_bp.route('/peminjaman/user/<string:email>', methods=['GET'])
def get_user_peminjaman(email):
    try:
        # Ambil semua peminjaman user berdasarkan email
        user_peminjaman = Peminjaman.query.filter_by(email=email).all()
        
        result = []
        for p in user_peminjaman:
            fasilitas = Fasilitas.query.get(p.id_fasilitas)
            result.append({
                'id': p.id,
                'nama_fasilitas': fasilitas.nama_fasilitas,
                'nama_organisasi': p.nama_organisasi,
                'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
                'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
                'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
                'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
                'status': p.status,
                'keperluan': p.keperluan,
                'komentar': p.komentar,
                'created_at': p.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500 
    
# Route untuk mendapatkan fasilitas yang dipinjam pada tanggal tertentu
@peminjaman_bp.route('/peminjaman/tanggal/<string:tanggal>', methods=['GET'])
def get_peminjaman_by_date(tanggal):
    try:
        # Parse tanggal dari string
        tanggal = datetime.strptime(tanggal, '%Y-%m-%d').date()
        
        # Cari peminjaman yang sedang atau akan dipinjam pada tanggal tersebut
        peminjaman_list = Peminjaman.query.filter(
            (Peminjaman.tanggal_mulai <= tanggal) & (Peminjaman.tanggal_selesai >= tanggal)
        ).all()

        result = []
        for p in peminjaman_list:
            fasilitas = Fasilitas.query.get(p.id_fasilitas)
            
            peminjaman_data = {
                'id': p.id,
                'nama_organisasi': p.nama_organisasi,
                'penanggung_jawab': p.penanggung_jawab,
                'nama_fasilitas': fasilitas.nama_fasilitas if fasilitas else None,
                'tanggal_mulai': p.tanggal_mulai.strftime('%Y-%m-%d'),
                'tanggal_selesai': p.tanggal_selesai.strftime('%Y-%m-%d'),
                'waktu_mulai': p.waktu_mulai.strftime('%H:%M'),
                'waktu_selesai': p.waktu_selesai.strftime('%H:%M'),
                'status': p.status,
                'keperluan': p.keperluan
            }
            result.append(peminjaman_data)
        
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
