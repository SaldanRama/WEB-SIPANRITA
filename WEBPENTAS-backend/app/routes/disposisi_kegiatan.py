from flask import Blueprint, request, jsonify
from app import db
from app.models.disposisi_kegiatan import DisposisiKegiatan
from app.models.izin_kegiatan import IzinKegiatan
from datetime import datetime

disposisi_kegiatan_bp = Blueprint('disposisi_kegiatan', __name__)

# Get semua disposisi-kegiatan
@disposisi_kegiatan_bp.route('/disposisi-kegiatan', methods=['GET'])
def get_all_disposisi_kegiatan():
    try:
        disposisi = DisposisiKegiatan.query.all()
        return jsonify([{
            'id': d.id,
            'id_izin_kegiatan': d.id_izin_kegiatan,
            'dari': d.dari,
            'kepada': d.kepada,
            'status_disposisi': d.status_disposisi,
            'komentar': d.komentar, 
            'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for d in disposisi])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get disposisi-kegiatan by ID
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/<int:id>', methods=['GET'])
def get_disposisi_kegiatan(id):
    try:
        disposisi = DisposisiKegiatan.query.get_or_404(id)
        izin_kegiatan = IzinKegiatan.query.get_or_404(disposisi.id_izin_kegiatan)

        return jsonify({
            'id': disposisi.id,
            'id_izin_kegiatan': disposisi.id_izin_kegiatan,
            'dari': disposisi.dari,
            'kepada': disposisi.kepada,
            'status_disposisi': disposisi.status_disposisi,
            'komentar': disposisi.komentar,
            'created_at': disposisi.created_at.strftime('%Y-%m-%d %H:%M:%S') if disposisi.created_at else None,
            'nama_organisasi': izin_kegiatan.nama_organisasi,
            'penanggung_jawab': izin_kegiatan.penanggung_jawab,
            'kontak_pj': izin_kegiatan.kontak_pj,
            'keperluan': izin_kegiatan.keperluan,
            'email': izin_kegiatan.email,
            'surat_perizinan': izin_kegiatan.surat_perizinan
        })
    except Exception as e:
        return jsonify({'error': 'Terjadi kesalahan, silakan coba lagi nanti.'}), 500

# Tambah disposisi-kegiatan baru
@disposisi_kegiatan_bp.route('/disposisi-kegiatan', methods=['POST'])
def add_disposisi_kegiatan():
    try:
        data = request.get_json()
        required_fields = ['id_izin_kegiatan', 'dari', 'kepada']

        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} harus diisi'}), 400

        izin_kegiatan = IzinKegiatan.query.get(data['id_izin_kegiatan'])
        if not izin_kegiatan:
            return jsonify({'error': 'Izin kegiatan tidak ditemukan'}), 404

        new_disposisi = DisposisiKegiatan(
            id_izin_kegiatan=data['id_izin_kegiatan'],
            dari=data['dari'],
            kepada=data['kepada'],
            komentar=data.get('komentar', '')
        )

        izin_kegiatan.status = 'disposisi'
        db.session.add(new_disposisi)
        db.session.commit()

        return jsonify({
            'message': 'Disposisi kegiatan berhasil ditambahkan',
            'data': {
                'id': new_disposisi.id,
                'status_disposisi': new_disposisi.status_disposisi
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Update status disposisi-kegiatan
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/<int:id>/status', methods=['PUT'])
def update_disposisi_status(id):
    try:
        # Ambil data disposisi berdasarkan ID
        disposisi = DisposisiKegiatan.query.get_or_404(id)
        data = request.get_json()

        # Pastikan field status ada di data yang dikirim
        if 'status_disposisi' not in data:
            return jsonify({'error': 'Status disposisi harus diisi'}), 400

        # Validasi status
        allowed_status = ['pending', 'ditolak', 'disetujui']
        status_disposisi = data['status_disposisi'].lower()
        if status_disposisi not in allowed_status:
            return jsonify({'error': f'Status harus salah satu dari: {", ".join(allowed_status)}'}), 400

        # Update status disposisi
        disposisi.status_disposisi = status_disposisi

        # Update komentar jika ada
        if 'komentar' in data:
            disposisi.komentar = data['komentar']

        db.session.commit()  # Simpan perubahan disposisi terlebih dahulu

        # Jika status ditolak, update tabel izin_kegiatan
        if status_disposisi == 'ditolak':
            izin_kegiatan = IzinKegiatan.query.get_or_404(disposisi.id_izin_kegiatan)
            izin_kegiatan.status = 'ditolak'
            izin_kegiatan.komentar = data.get('komentar', '')  # Simpan komentar jika ada

            db.session.commit()  # Simpan perubahan ke tabel izin_kegiatan

        return jsonify({
            'message': 'Status disposisi berhasil diperbarui',
            'data': {
                'id': disposisi.id,
                'status_disposisi': disposisi.status_disposisi,
                'komentar': disposisi.komentar
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e), 'message': 'Gagal memperbarui status disposisi'}), 500

# Get disposisi kegiatan untuk wakil dekan 1 dengan filter status disposisi
@disposisi_kegiatan_bp.route('/perizinan/wadek1', methods=['GET'])
def get_wadek1_perizinan():
    try:
        # Tambahkan filter status_disposisi='disposisi'
        disposisi_wakil = DisposisiKegiatan.query.filter_by(kepada='wakil_dekan1')\
            .filter(DisposisiKegiatan.status_disposisi == 'pending').all()

        result = []
        for d in disposisi_wakil:
            izin_kegiatan = IzinKegiatan.query.get(d.id_izin_kegiatan)

            if izin_kegiatan:
                result.append({
                    'id': d.id,
                    'nama_organisasi': izin_kegiatan.nama_organisasi,
                    'penanggung_jawab': izin_kegiatan.penanggung_jawab,
                    'status_disposisi': d.status_disposisi,
                    'keperluan': izin_kegiatan.keperluan,
                    'created_at': d.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Get recent notifications for wakil dekan 1
@disposisi_kegiatan_bp.route('/perizinan/wadek1/notifications', methods=['GET'])
def get_wadek1_notifications():
    try:
        recent_disposisi = DisposisiKegiatan.query.filter_by(kepada='wakil_dekan1')\
            .order_by(DisposisiKegiatan.created_at.desc())\
            .limit(5)\
            .all()

        result = []
        for d in recent_disposisi:
            izin_kegiatan = IzinKegiatan.query.get(d.id_izin_kegiatan)
            if izin_kegiatan:
                result.append({
                    'id': d.id,
                    'nama_organisasi': izin_kegiatan.nama_organisasi,
                    'keperluan': izin_kegiatan.keperluan,
                    'status_disposisi': d.status_disposisi,
                    'tanggal_permintaan': izin_kegiatan.tanggal_permintaan.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get disposisi history for wakil dekan 1
@disposisi_kegiatan_bp.route('/disposisi-kegiatan/history/wadek1', methods=['GET'])
def get_wadek1_history():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 30))
        offset = (page - 1) * limit

        query = DisposisiKegiatan.query.filter_by(kepada='wakil_dekan1')\
            .filter(DisposisiKegiatan.status_disposisi.in_(['disetujui', 'ditolak']))
        
        total_items = query.count()
        history = query.order_by(DisposisiKegiatan.created_at.desc())\
            .offset(offset).limit(limit).all()

        result = []
        for d in history:
            izin_kegiatan = IzinKegiatan.query.get(d.id_izin_kegiatan)
            if izin_kegiatan:
                result.append({
                    'id': d.id,
                    'nama_organisasi': izin_kegiatan.nama_organisasi,
                    'keperluan': izin_kegiatan.keperluan,
                    'status_disposisi': d.status_disposisi,
                    'komentar': d.komentar,
                    'tanggal_permintaan': izin_kegiatan.tanggal_permintaan.strftime('%Y-%m-%d %H:%M:%S')
                })
        return jsonify({
            'data': result,
            'total': total_items,
            'page': page,
            'pages': (total_items + limit - 1) // limit  # Menghitung total halaman
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500