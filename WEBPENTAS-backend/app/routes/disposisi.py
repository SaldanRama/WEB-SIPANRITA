from flask import Blueprint, request, jsonify
from app import db
from app.models.disposisi import Disposisi
from app.models.peminjaman import Peminjaman
from app.models.fasilitas import Fasilitas
from datetime import datetime

disposisi_bp = Blueprint('disposisi', __name__)

# Get semua disposisi
@disposisi_bp.route('/disposisi', methods=['GET'])
def get_all_disposisi():
    try:
        disposisi = Disposisi.query.all()
        return jsonify([{
            'id': d.id,
            'id_peminjaman': d.id_peminjaman,
            'dari': d.dari,
            'kepada': d.kepada,
            'status_disposisi': d.status_disposisi,
            'catatan': d.catatan,
            'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for d in disposisi])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get disposisi by ID
@disposisi_bp.route('/disposisi/<int:id>', methods=['GET'])
def get_disposisi(id):
    try:
        # Ambil data disposisi dengan relasi ke peminjaman
        disposisi = Disposisi.query.get_or_404(id)
        peminjaman = Peminjaman.query.get_or_404(disposisi.id_peminjaman)  # Relasi langsung ke Peminjaman
        fasilitas = peminjaman.fasilitas if peminjaman else None  # Relasi ke Fasilitas
        
        # Pastikan data peminjaman dan fasilitas ada
        if not peminjaman:
            return jsonify({'error': 'Data peminjaman tidak ditemukan'}), 404
        if not fasilitas:
            return jsonify({'error': 'Data fasilitas tidak ditemukan'}), 404

        # Format data untuk JSON response
        return jsonify({
            'id': disposisi.id,
            'id_peminjaman': disposisi.id_peminjaman,
            'dari': disposisi.dari,
            'kepada': disposisi.kepada,
            'status_disposisi': disposisi.status_disposisi,
            'catatan': disposisi.catatan,
            'created_at': disposisi.created_at.strftime('%Y-%m-%d %H:%M:%S') if disposisi.created_at else None,
            'nama_organisasi': peminjaman.nama_organisasi,
            'penanggung_jawab': peminjaman.penanggung_jawab,
            'kontak_pj': peminjaman.kontak_pj,
            'email': peminjaman.email,
            'tanggal_mulai': peminjaman.tanggal_mulai.strftime('%Y-%m-%d') if peminjaman.tanggal_mulai else None,
            'tanggal_selesai': peminjaman.tanggal_selesai.strftime('%Y-%m-%d') if peminjaman.tanggal_selesai else None,
            'waktu_mulai': peminjaman.waktu_mulai.strftime('%H:%M') if peminjaman.waktu_mulai else None,
            'waktu_selesai': peminjaman.waktu_selesai.strftime('%H:%M') if peminjaman.waktu_selesai else None,
            'keperluan': peminjaman.keperluan,
            'surat_peminjaman': peminjaman.surat_peminjaman,
            'nama_fasilitas': fasilitas.nama_fasilitas
        })
    except Exception as e:
        # Log kesalahan untuk debugging
        print(f"Error fetching disposisi: {str(e)}")
        return jsonify({'error': 'Terjadi kesalahan, silakan coba lagi nanti.'}), 500



# Tambah disposisi baru
@disposisi_bp.route('/disposisi', methods=['POST'])
def add_disposisi():
    try:
        data = request.get_json()
        
        # Validasi input
        required_fields = ['id_peminjaman', 'dari', 'kepada']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} harus diisi'}), 400
        
        # Validasi peminjaman exists
        peminjaman = Peminjaman.query.get(data['id_peminjaman'])
        if not peminjaman:
            return jsonify({'error': 'Peminjaman tidak ditemukan'}), 404
        
        new_disposisi = Disposisi(
            id_peminjaman=data['id_peminjaman'],
            dari=data['dari'],
            kepada=data['kepada'],
            catatan=data.get('catatan', '')
        )
        
        # Update status peminjaman menjadi 'disposisi'
        peminjaman.status = 'disposisi'
        
        db.session.add(new_disposisi)
        db.session.commit()
        
        return jsonify({
            'message': 'Disposisi berhasil ditambahkan',
            'data': {
                'id': new_disposisi.id,
                'status_disposisi': new_disposisi.status_disposisi,
                'peminjaman_status': peminjaman.status
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update status disposisi
@disposisi_bp.route('/disposisi/<int:id>/status', methods=['PUT'])
def update_status(id):
    try:
        disposisi = Disposisi.query.get_or_404(id)
        data = request.get_json()

        # Validasi status dan catatan
        if 'status_disposisi' not in data:
            return jsonify({'error': 'Status disposisi harus diisi'}), 400

        allowed_status = ['pending', 'disetujui', 'ditolak']
        if data['status_disposisi'] not in allowed_status:
            return jsonify({'error': f'Status harus salah satu dari: {", ".join(allowed_status)}'}), 400

        disposisi.status_disposisi = data['status_disposisi']

        # Simpan catatan jika status ditolak
        if data['status_disposisi'] == 'ditolak':
            if 'catatan' not in data or not data['catatan'].strip():
                return jsonify({'error': 'Catatan penolakan harus diisi'}), 400
            disposisi.catatan = data['catatan']

            # Update komentar di peminjaman
            peminjaman = Peminjaman.query.get(disposisi.id_peminjaman)
            if peminjaman:
                peminjaman.status = 'ditolak'
                peminjaman.komentar = data['catatan']

        db.session.commit()
        return jsonify({
            'message': 'Status berhasil diupdate',
            'status': disposisi.status_disposisi
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@disposisi_bp.route('/peminjaman/wadek', methods=['GET'])
def get_wadek_peminjaman():
    try:
        disposisi_wadek = Disposisi.query.filter_by(kepada='wakil_dekan').all()
        
        result = []
        for d in disposisi_wadek:
            peminjaman = Peminjaman.query.get(d.id_peminjaman)
            fasilitas = Fasilitas.query.get(peminjaman.id_fasilitas) if peminjaman else None
            
            if peminjaman and fasilitas:
                result.append({
                    'id': d.id,
                    'nama_organisasi': peminjaman.nama_organisasi,
                    'penanggung_jawab': peminjaman.penanggung_jawab,
                    'nama_fasilitas': fasilitas.nama_fasilitas,
                   'status_disposisi': d.status_disposisi,
                    'tanggal_mulai': peminjaman.tanggal_mulai.strftime('%Y-%m-%d'),
                    'tanggal_selesai': peminjaman.tanggal_selesai.strftime('%Y-%m-%d'),
                    'waktu_mulai': peminjaman.waktu_mulai.strftime('%H:%M'),
                    'waktu_selesai': peminjaman.waktu_selesai.strftime('%H:%M'),
                    'keperluan': peminjaman.keperluan,
                    'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify(result)
    except Exception as e:
        print(f"Error: {str(e)}")  # Tambahkan logging
        return jsonify({'error': str(e)}), 500

@disposisi_bp.route('/peminjaman/wadek/notifications', methods=['GET'])
def get_wadek_notifications():
    try:
        # Ambil 5 disposisi terbaru untuk wakil dekan
        recent_disposisi = Disposisi.query.filter_by(kepada='wakil_dekan')\
            .order_by(Disposisi.created_at.desc())\
            .limit(5)\
            .all()
        
        result = []
        for d in recent_disposisi:
            peminjaman = Peminjaman.query.get(d.id_peminjaman)
            if peminjaman:
                result.append({
                    'id': d.id,
                    'nama_organisasi': peminjaman.nama_organisasi,
                    'status': d.status_disposisi,
                    'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disposisi_bp.route('/disposisi/history/wadek', methods=['GET'])
def get_wadek_history():
    try:
        # Ambil semua disposisi wakil dekan yang sudah selesai
        history = Disposisi.query.filter_by(kepada='wakil_dekan')\
            .filter(Disposisi.status_disposisi.in_(['disetujui', 'ditolak']))\
            .order_by(Disposisi.created_at.desc())\
            .all()
        
        result = []
        for d in history:
            peminjaman = Peminjaman.query.get(d.id_peminjaman)
            fasilitas = Fasilitas.query.get(peminjaman.id_fasilitas)
            if peminjaman and fasilitas:
                result.append({
                    'id': d.id,
                    'nama_organisasi': peminjaman.nama_organisasi,
                    'nama_fasilitas': fasilitas.nama_fasilitas,
                    'status_disposisi': d.status_disposisi,
                    'catatan': d.catatan,
                    'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500