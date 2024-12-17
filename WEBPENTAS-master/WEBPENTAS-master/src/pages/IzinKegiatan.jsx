import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Pastikan untuk import useParams jika Anda memerlukan params dari URL

export const IzinKegiatan = () => {
  const { id } = useParams();

  // State untuk menyimpan data form
  const [formData, setFormData] = useState({
    nama_organisasi: '',
    penanggung_jawab: '',
    kontak_pj: '',
    keperluan: '',
    email: '',
    surat_perizinan: null,
    komentar: ''
  });

  // State untuk status form, pesan error, dan user
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null); // Status pengguna
  const [error, setError] = useState('');
  const [suratPerizinan, setSuratPerizinan] = useState(null); // File surat izin
  const [toastMessage, setToastMessage] = useState(null); // State untuk pesan toast

  // Ref untuk file input
  const fileInputRef = useRef(null);

  // Fetch data user pada saat login atau mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');  // Ambil email user dari localStorage
        if (userEmail) {
          const response = await axios.get('http://localhost:5000/users', {
            params: { email: userEmail }
          });

          if (response.data && Array.isArray(response.data)) {
            const user = response.data.find(u => u.email === userEmail);
            if (user) {
              setUserId(user.id);  // Menyimpan userId jika ditemukan
            } else {
              setError('Data pengguna tidak ditemukan');
            }
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data pengguna:', err);
        setError('Terjadi kesalahan saat mengambil data pengguna');
      }
    };

    fetchUserData();
  }, []);  // Efek berjalan hanya sekali pada saat mount

  // Menangani submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setToastMessage('');

    if (!userId) {
      setError('Silakan login terlebih dahulu');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id_user', String(userId));

      // Menambahkan data form ke FormData
      Object.keys(formData).forEach(key => {
        if (key !== 'id_user') formDataToSend.append(key, formData[key]);
      });

      // Menambahkan file surat perizinan jika ada
      if (suratPerizinan) {
        formDataToSend.append('surat_perizinan', suratPerizinan);
      }

      const response = await axios.post('http://localhost:5000/izin-kegiatan', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.message) {
        setToastMessage('Permohonan Anda telah dikirim');
        
        // Reset form setelah permohonan berhasil dikirim
        setFormData({
          nama_organisasi: '',
          penanggung_jawab: '',
          kontak_pj: '',
          keperluan: '',
          email: '',
          surat_perizinan: null,
          komentar: ''
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input setelah submit
        }
        setSuratPerizinan(null); // Reset surat perizinan state juga
      }
    } catch (err) {
      console.error('Error detail:', err.response?.data);
      setError(err.response?.data?.error || 'Terjadi kesalahan saat mengajukan permohonan izin');
    } finally {
      setLoading(false);
    }
  };

  // Menangani perubahan pada file surat perizinan
  const handleFileChange = (e) => {
    setSuratPerizinan(e.target.files[0]);
  };

  // Auto-hide toast setelah 5 detik
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null); // Menghilangkan toast setelah 5 detik
      }, 5000);

      return () => clearTimeout(timer); // Bersihkan timer saat component di-unmount atau toastMessage berubah
    }
  }, [toastMessage]);

  // Render form
  return (
    <div className="container my-5">
      <h2 className="text-center mb-4 fw-semibold">FORM PERMOHONAN IZIN KEGIATAN</h2>
      <div className="card">
        <div className="card-body">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="namaOrganisasi" className="form-label">Nama Organisasi</label>
              <input
                type="text"
                className="form-control"
                id="namaOrganisasi"
                value={formData.nama_organisasi}
                onChange={(e) => setFormData({ ...formData, nama_organisasi: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="penanggungJawab" className="form-label">Penanggung Jawab</label>
              <input
                type="text"
                className="form-control"
                id="penanggungJawab"
                value={formData.penanggung_jawab}
                onChange={(e) => setFormData({ ...formData, penanggung_jawab: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="kontakPj" className="form-label">Kontak Penanggung Jawab</label>
              <input
                type="text"
                className="form-control"
                id="kontakPj"
                value={formData.kontak_pj}
                onChange={(e) => setFormData({ ...formData, kontak_pj: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="keperluan" className="form-label">Keperluan</label>
              <input
                type="text"
                className="form-control"
                id="keperluan"
                value={formData.keperluan}
                onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="suratPerizinan" className="form-label">Surat Perizinan</label>
              <input
                type="file"
                className="form-control"
                id="suratPerizinan"
                onChange={handleFileChange}
                ref={fileInputRef}  // Set ref pada file input
                required
              />
            </div>

            <div className="d-grid gap-2 mb-3">
              <button type="submit" className="btn btn-danger" disabled={loading}>
                {loading ? 'Mengirim...' : 'Ajukan Permohonan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 1050 }}
        >
          <div
            className="toast show"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="toast-header">
              <strong className="me-auto">Notifikasi</strong>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="toast"
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default IzinKegiatan;
