from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.user import User
from app import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            return jsonify({
                'message': 'Login berhasil',
                'role': user.role,
                'email': user.email
            })

        return jsonify({
            'message': 'Email atau password salah'
        }), 401

    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Terjadi kesalahan pada server'
        }), 500

@auth_bp.route('/check-user/<email>', methods=['GET'])
def check_user(email):
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({
            'found': True,
            'email': user.email,
            'role': user.role
        })
    return jsonify({
        'found': False
    })

@auth_bp.route('/users', methods=['GET', 'POST'])
def users():
    if request.method == 'GET':
        try:
            users = User.query.all()
            return jsonify([{
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'create_at': user.create_at
            } for user in users])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif request.method == 'POST':
        try:
            data = request.get_json()

            # Validasi input
            if not all(k in data for k in ['email', 'password', 'role']):
                return jsonify({'error': 'Email, password dan role harus diisi'}), 400

            # Cek email unik
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email sudah terdaftar'}), 400

            hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256', salt_length=8)

            new_user = User(
                email=data['email'],
                password=hashed_password,
                role=data['role']
            )

            db.session.add(new_user)
            db.session.commit()

            return jsonify({
                'message': 'User berhasil ditambahkan',
                'data': {
                    'id': new_user.id,
                    'email': new_user.email,
                    'role': new_user.role
                }
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:id>', methods=['PUT', 'DELETE'])
def user_detail(id):
    if request.method == 'PUT':
        try:
            user = User.query.get_or_404(id)
            data = request.get_json()

            # Update email
            if 'email' in data:
                user.email = data['email']

            # Update password jika ada
            if 'password' in data and data['password']:
                user.password = generate_password_hash(data['password'], method='pbkdf2:sha256', salt_length=8)

            # Update role
            if 'role' in data:
                if data['role'] not in ['mahasiswa', 'admin', 'dekan', 'wakil_dekan']:
                    return jsonify({'error': 'Role tidak valid'}), 400
                user.role = data['role']

            db.session.commit()
            return jsonify({'message': 'User berhasil diupdate'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    elif request.method == 'DELETE':
        try:
            user = User.query.get_or_404(id)
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User berhasil dihapus'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500


@auth_bp.route('/user-by-email', methods=['GET'])
def get_user_by_email():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email parameter required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': user.id,
            'email': user.email,
            'role': user.role
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
