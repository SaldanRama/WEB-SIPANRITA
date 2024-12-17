import { Routes, Route, NavLink, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaInbox, FaCheckCircle, FaTimesCircle, FaSignOutAlt } from "react-icons/fa";
import '../disc/css/main.css'; 
import axios from "axios";

export function DashboardWakilDekan1() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>Dashboard WD 1</h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard-wadek1" end className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-home"></i>
            Beranda
          </NavLink>
          
          <NavLink to="/dashboard-wadek1/disposisi-kegiatan" className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-inbox"></i>
            Daftar Perizinan
          </NavLink>
          
          <NavLink to="/dashboard-wadek1/riwayat" className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-history"></i>
            Riwayat Perizinan
          </NavLink>

          <button 
            className="nav-item logout-button" 
            onClick={() => {
              // Hapus data di localStorage
              localStorage.removeItem('userRole');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('isLoggedIn');
              // Arahkan ke halaman login
              window.location.href = '/login';
            }}
            style={{
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FaSignOutAlt className="me-2"/>
            <span>Logout</span>
          </button>          
        </nav>
      </div>

      <main className={`dashboard-main ${!isSidebarOpen ? 'full' : ''}`}>
        <button 
          className="toggle-sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '←' : '→'}
        </button>

        <Routes>
          <Route index element={<BerandaWadek />} />
          <Route path="disposisi-kegiatan" element={<DaftarDisposisi />} />
          <Route path="disposisi-kegiatan/:id" element={<DetailDisposisi />} />
          <Route path="riwayat" element={<RiwayatAktivitas />} />
        </Routes>
      </main>
    </div>
  );
}

function BerandaWadek() {
  const [stats, setStats] = useState({
    pending: 0, // Default 0 untuk status 'pending'
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/perizinan/wadek1');
      const data = await response.json();

      // Menghitung jumlah status_disposisi 'pending'
      const counts = data.reduce((acc, curr) => {
        acc[curr.status_disposisi] = (acc[curr.status_disposisi] || 0) + 1;
        return acc;
      }, {});

      setStats({
        pending: counts['pending'] || 0, // Ambil jumlah 'pending', default 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/perizinan/wadek1/notifications');
      const data = await response.json();
      setNotifications(data.slice(0, 5)); // Ambil 5 notifikasi terbaru
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      {/* Statistik Disposisi */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaInbox />
          </div>
          <div className="stat-info">
            <h3>Disposisi Pending</h3>
            <div className="value">{stats.pending}</div>
          </div>
        </div>
      </div>

      {/* Notifikasi Terbaru */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="notification-list">
            {notifications.map((notif) => (
              <div key={notif.id} className="perizinan-item">
                <div className="perizinan-info">
                  <hr />
                  <h4>{notif.nama_organisasi}</h4>
                  <h5>{notif.keperluan}</h5>
                  <p>
                    {new Date(
                      new Date(notif.tanggal_permintaan).getTime() + 8 * 60 * 60 * 1000
                    ).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <span
                    className={`status-badge ${notif.status_disposisi}`}
                  >
                    {notif.status_disposisi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function DaftarDisposisi() {
  const [perizinan, setPerizinan] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPerizinan();
  }, []);

  const fetchPerizinan = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/perizinan/wadek1');
      const data = await response.json();

      if (Array.isArray(data)) {
        // Filter data untuk status 'disposisi'
        const filteredPerizinan = data
          .filter((item) => item.status_disposisi === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Urutkan dari terbaru

        setPerizinan(filteredPerizinan);
      } else if (data.error) {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setPerizinan([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Perizinan (Status Disposisi)</h1>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Organisasi</th>
              <th>Penanggung Jawab</th>
              <th>Keperluan</th>
              <th>Tanggal Permintaan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {perizinan.length > 0 ? (
              perizinan.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.keperluan}</td>
                  <td>
                    {new Date(item.created_at).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className={`status-badge ${item.status_disposisi}`}>
                      {item.status_disposisi}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-detail"
                        onClick={() => navigate(`/dashboard-wadek1/disposisi-kegiatan/${item.id}`)}
                      >
                        <i className="fas fa-eye"></i>
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">Tidak ada surat izin yang di Disposisi</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function DetailDisposisi() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disposisi, setDisposisi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectComment, setRejectComment] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch data disposisi pada mount pertama dan saat 'id' berubah
  useEffect(() => {
    fetchDetailDisposisi();
  }, [id]);

  // Fungsi untuk memuat detail disposisi
  const fetchDetailDisposisi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/disposisi-kegiatan/${id}`);
      const data = await response.json();
      setDisposisi(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk memperbarui status disposisi (Setujui/Tolak)
  const handleStatusUpdate = async (status, comment = null) => {
    try {
      const body = { status_disposisi: status };
      if (status === 'ditolak' && comment) {
        body.komentar = comment;
      }

      const disposisiResponse = await fetch(`http://localhost:5000/disposisi-kegiatan/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (disposisiResponse.ok) {
        const perizinanResponse = await fetch(`http://localhost:5000/izin-kegiatan/${disposisi.id_izin_kegiatan}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (perizinanResponse.ok) {
          setToastMessage('Status berhasil diperbarui');
          await fetchDetailDisposisi();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Fungsi untuk menangani penolakan disposisi
  const handleReject = async () => {
    if (rejectComment.trim() === '') {
      alert('Alasan penolakan harus diisi.');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/disposisi-kegiatan/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_disposisi: 'ditolak',
          komentar: rejectComment,
        }),
      });
  
      if (response.ok) {
        setToastMessage('Perizinan berhasil ditolak');
  
        // Tutup modal Bootstrap secara manual
        const modalElement = document.getElementById('rejectModal');
        const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }
  
        // Tunggu sedikit untuk memastikan modal tertutup
        setTimeout(() => {
          window.location.reload(); // Refresh halaman
        }, 300); // Timeout kecil untuk memastikan transisi modal selesai
      } else {
        console.error('Error rejecting:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
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

  if (loading) return <div className="loading">Memuat data...</div>;
  if (!disposisi) return <div>Data tidak ditemukan</div>;

  return (
    <div className="detail-container">
      <h2>Detail Perizinan</h2>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <strong className="me-auto">Notifikasi</strong>
              <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div className="toast-body">{toastMessage}</div>
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr><td>Nama Organisasi</td><td>: {disposisi.nama_organisasi}</td></tr>
            <tr><td>Penanggung Jawab</td><td>: {disposisi.penanggung_jawab}</td></tr>
            <tr><td>Kontak</td><td>: {disposisi.kontak_pj}</td></tr>
            <tr><td>Email</td><td>: {disposisi.email}</td></tr>
            <tr><td>Keperluan</td><td>: {disposisi.keperluan}</td></tr>
            <tr>
              <td>Status</td>
              <td>: <span className={`status-badge ${disposisi.status_disposisi}`}>{disposisi.status_disposisi}</span>
              </td>
            </tr>
            {disposisi.status_disposisi === 'ditolak' && (
              <tr>
                <td>Komentar</td>
                <td>: {disposisi.komentar}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Dokumen</h3>
        {disposisi.surat_perizinan ? (
          <div className="document-preview">
            <p>Nama File: {disposisi.surat_perizinan}</p>
            <div className="document-actions">
              <a
                href={`http://localhost:5000/uploads/${disposisi.surat_perizinan}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fas fa-download"></i> Unduh Surat
              </a>
              {disposisi.surat_perizinan.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`http://localhost:5000/uploads/${disposisi.surat_perizinan}#toolbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                  style={{ marginTop: '10px', border: '1px solid #ddd' }}
                />
              ) : (
                <img
                  src={`http://localhost:5000/uploads/${disposisi.surat_perizinan}`}
                  alt="Preview Surat"
                  style={{ maxWidth: '100%', marginTop: '10px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <p>Tidak ada dokumen yang tersedia</p>
        )}
      </div>

      <div className="action-buttons">
        {disposisi.status_disposisi === 'pending' && (
          <>
            <button className="btn-approve" onClick={() => handleStatusUpdate('disetujui')}>
              <i className="fas fa-check"></i> Setujui
            </button>
            <button
              className="btn btn-danger"
              data-bs-toggle="modal"
              data-bs-target="#rejectModal"
            >
              <i className="fas fa-times"></i> Tolak
            </button>
          </>
        )}
        <button className="btn-back" onClick={() => navigate('/dashboard-wadek1/disposisi-kegiatan')}>
          <i className="fas fa-arrow-left"></i> Kembali
        </button>
      </div>

      {/* Modal Tolak */}
      <div
        className="modal fade"
        id="rejectModal"
        tabIndex="-1"
        aria-labelledby="rejectModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="rejectModalLabel">Alasan Penolakan</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <textarea
                className="form-control"
                placeholder="Masukkan alasan penolakan..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setRejectComment("")}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReject}
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function RiwayatAktivitas() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 30; // Jumlah data per halaman

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/disposisi-kegiatan/history/wadek1?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Gagal memuat data riwayat.');
      }

      const data = await response.json();
      setHistory(data.data);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) return <div className="text-center mt-3">Memuat riwayat...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container m-4">
      <h2 className="mb-4 fw-semibold">Riwayat Aktivitas</h2>

      {history.length === 0 ? (
        <div className="alert alert-warning text-center">Tidak ada riwayat aktivitas.</div>
      ) : (
        <div className="table-container mb-4">
          <table className="data-table">
            <thead className="table-dark">
              <tr>
                <th>No</th>
                <th>Nama Organisasi</th>
                <th>Keperluan</th>
                <th>Status</th>
                <th>Komentar</th>
                <th>Tanggal Permintaan</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={item.id}>
                  <td>{(currentPage - 1) * limit + index + 1}</td>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.keperluan}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status_disposisi === 'disetujui'
                          ? 'bg-success'
                          : 'bg-danger'
                      }`}
                    >
                      {item.status_disposisi}
                    </span>
                  </td>
                  <td>{item.komentar || '-'}</td>
                  <td>{item.tanggal_permintaan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bootstrap Pagination */}
      <nav>
        <ul className="pagination justify-content-center">
          {/* Tombol Previous */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
              Previous
            </button>
          </li>

          {/* Nomor Halaman */}
          {Array.from({ length: totalPages }, (_, i) => (
            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                {i + 1}
              </button>
            </li>
          ))}

          {/* Tombol Next */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}