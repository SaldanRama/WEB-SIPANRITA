import { useState, useEffect } from 'react';
import axios from 'axios';
import '../disc/css/components/NotificationComponents.css';

const NotificationComponents = () => {
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchPeminjaman = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/peminjaman/user/${userEmail}`);
        const sortedPeminjaman = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        console.log('User peminjaman:', sortedPeminjaman);
        setPeminjaman(sortedPeminjaman);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && userEmail) {
      fetchPeminjaman();
    }
  }, [isLoggedIn, userEmail]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'pending',
      disetujui: 'disetujui',
      ditolak: 'ditolak',
      disposisi: 'disposisi',
    };
    return badges[status] || 'pending';
  };

  if (!isLoggedIn) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Silakan login terlebih dahulu untuk melihat status peminjaman Anda
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <h4 className="notification-title">Status Peminjaman</h4>
      <div className="notifications-wrapper">
        {loading ? (
          <div className="notification-alert info">Memuat status peminjaman...</div>
        ) : error ? (
          <div className="notification-alert error">{error}</div>
        ) : peminjaman.length === 0 ? (
          <div className="notification-alert info">Belum ada peminjaman</div>
        ) : (
          peminjaman.map((pinjam) => (
            <div key={pinjam.id} className="notification-card">
              <div className="notification-header">
                <h5 className="facility-name">{pinjam.nama_fasilitas}</h5>
                <span className={`status-badge ${getStatusBadge(pinjam.status)}`}>
                  {pinjam.status || 'pending'}
                </span>
              </div>
              <div className="notification-body">
                <div className="info-row">
                  <span className="label">Organisasi:</span>
                  <span className="value">{pinjam.nama_organisasi}</span>
                </div>
                <div className="info-row">
                  <span className="label">Tanggal:</span>
                  <span className="value">
                    {pinjam.tanggal_mulai} - {pinjam.tanggal_selesai}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Waktu:</span>
                  <span className="value">
                    {pinjam.waktu_mulai} - {pinjam.waktu_selesai}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Keperluan:</span>
                  <span className="value">{pinjam.keperluan}</span>
                </div>
                {pinjam.status === 'ditolak' && pinjam.komentar && (
                  <div className="info-row">
                    <span className="label text-danger">Alasan Ditolak:</span>
                    <span className="value text-danger">{pinjam.komentar}</span>
                  </div>
                )}
              </div>
              <div className="notification-footer">
                <small className="timestamp">
                  Diajukan pada: {new Date(pinjam.created_at).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationComponents;
