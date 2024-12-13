from flask import Blueprint, request, jsonify
from flask_mail import Message
from flask import current_app as app
from app import mail

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/contact', methods=['POST'])
def send_message():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')

    # Membuat pesan yang akan dikirim ke pengguna
    user_message = Message(
        subject='Terima Kasih Telah Menghubungi Kami',
        recipients=[email]
    )
    user_message.body = f"""
    Halo {name},

    Terima kasih telah menghubungi kami! Kami telah menerima pesan Anda dan akan segera meresponsnya dalam waktu singkat.

    Berikut adalah informasi yang Anda kirimkan:
    - Nama: {name}
    - Email: {email}
    - Subjek: {subject}
    - Pesan: {message}

    Kami akan segera menghubungi Anda kembali untuk menanggapi pertanyaan atau permintaan Anda.

    Salam hormat,
    Tim Kami
    """

    # Membuat pesan yang akan dikirim ke admin
    admin_message = Message(
        subject='Pesan Baru dari Pengguna Website Pentas',
        recipients=['mailpentas24@gmail.com']
    )
    admin_message.body = f"""
    Hai Admin,

    Ada pesan baru yang dikirimkan melalui form kontak di website Anda. Berikut adalah detailnya:

    - Nama Pengguna: {name}
    - Email Pengguna: {email}
    - Subjek Pesan: {subject}
    - Pesan: {message}

    Untuk menanggapi pesan ini, silakan hubungi pengguna melalui email di atas.

    Terima kasih,
    Tim Website Kami
    """

    try:
        # Kirim email ke pengguna
        print(f"Sending email to user: {user_message.recipients}")
        mail.send(user_message)
        
        # Kirim email ke admin
        print(f"Sending email to admin: {admin_message.recipients}")
        mail.send(admin_message)

        return jsonify({"success": True, "message": "Pesan berhasil dikirim!"}), 200
    except Exception as e:
        print(f"Error: {e}")  # Ini akan mencetak kesalahan ke konsol
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500
