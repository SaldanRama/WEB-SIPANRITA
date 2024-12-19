import { Routes, Route, NavLink, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaInbox, FaCheckCircle, FaTimesCircle, FaSignOutAlt } from "react-icons/fa";
import '../disc/css/main.css'; 
import axios from "axios";

export function DashboardWakilDekan() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>Dashboard WD 2</h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard-wadek" end className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-home"></i>
            Beranda
          </NavLink>
          
          <NavLink to="/dashboard-wadek/disposisi" className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-inbox"></i>
            Daftar Peminjaman Fasilitas
          </NavLink>
          
          <NavLink to="/dashboard-wadek/riwayat" className={({isActive}) => 
            `nav-item ${isActive ? 'active' : ''}`
          }>
            <i className="fas fa-history"></i>
            Riwayat Peminjaman
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
          <Route path="disposisi" element={<DaftarDisposisi />} />
          <Route path="disposisi/:id" element={<DetailDisposisi />} />
          <Route path="riwayat" element={<RiwayatPeminjaman />} />
        </Routes>
      </main>
    </div>
  );
}

function BerandaWadek() {
  const [stats, setStats] = useState({
    pending: 0,
    disetujui: 0,
    ditolak: 0
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
      const response = await fetch('http://localhost:5000/peminjaman/wadek');
      const data = await response.json();
      
      const counts = data.reduce((acc, curr) => {
        acc[curr.status_disposisi] = (acc[curr.status_disposisi] || 0) + 1;
        return acc;
      }, {});

      setStats({
        pending: counts.pending || 0,
        disetujui: counts.disetujui || 0,
        ditolak: counts.ditolak || 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/peminjaman/wadek/notifications');
      const data = await response.json();

      setNotifications(data.slice(0, 5));
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
        
        <div className="stat-card">
          <div className="stat-icon approved">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Disetujui</h3>
            <div className="value">{stats.disetujui}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rejected">
            <FaTimesCircle />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Ditolak</h3>
            <div className="value">{stats.ditolak}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="notification-list">
            {notifications.map((notif) => (
              <div key={notif.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4>{notif.nama_organisasi}</h4>
                  <p>{new Date(new Date(notif.created_at).getTime() + (8 * 60 * 60 * 1000)).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}</p>
                  <span className={`status-badge ${notif.status}`}>
                    {notif.status}
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
  const [disposisi, setDisposisi] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDisposisi();
  }, []);

  const fetchDisposisi = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/peminjaman/wadek');
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedDisposisi = data
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .reverse();
        setDisposisi(sortedDisposisi);
      } else if (data.error) {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setDisposisi([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Memuat data...</div>;
  }

  // Filter data disposisi untuk menyembunyikan data yang sudah melewati tanggal peminjaman
  const filteredDisposisi = disposisi.filter((item) => {
    const endDateTime = new Date(`${item.tanggal_selesai}T${item.waktu_selesai}`);
    return endDateTime >= new Date(); // Menampilkan hanya yang masih aktif
  });

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Peminjaman Didisposisi</h1>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Organisasi</th>
              <th>Penanggung Jawab</th>
              <th>Fasilitas</th>
              <th>Tanggal & Waktu</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredDisposisi.length > 0 ? (
              filteredDisposisi.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>
                    {new Date(new Date(item.created_at).getTime() + (8 * 60 * 60 * 1000)).toLocaleString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
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
                        onClick={() => navigate(`/dashboard-wadek/disposisi/${item.id}`)}
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
                <td colSpan="6" className="text-center">Tidak ada peminjaman yang aktif</td>
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
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchDetailDisposisi();
  }, [id]);

  const fetchDetailDisposisi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/disposisi/${id}`);
      const data = await response.json();
      setDisposisi(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status, comment = null) => {
    try {
      const body = {
        status_disposisi: status,
      };

      if (status === 'ditolak' && comment) {
        body.catatan = comment;
      }

      const disposisiResponse = await fetch(`http://localhost:5000/disposisi/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (disposisiResponse.ok) {
        const peminjamanResponse = await fetch(`http://localhost:5000/peminjaman/${disposisi.id_peminjaman}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });

        if (peminjamanResponse.ok) {
          await fetchDetailDisposisi();
          navigate('/dashboard-wadek/disposisi');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReject = async () => {
    if (rejectComment.trim() === '') {
      alert('Alasan penolakan harus diisi.');
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/disposisi/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status_disposisi: 'ditolak',
          catatan: rejectComment, // Kirim catatan penolakan
        }),
      });
  
      if (response.ok) {
        await fetchDetailDisposisi(); // Refresh data
        setRejectComment('');
      } else {
        console.error('Error rejecting:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="loading">Memuat data...</div>;
  if (!disposisi) return <div>Data tidak ditemukan</div>;

  return (
    <div className="detail-container">
      <h2>Detail Peminjaman</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {disposisi.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {disposisi.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {disposisi.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {disposisi.email}</td>
            </tr>
            <tr>
              <td>Fasilitas</td>
              <td>: {disposisi.nama_fasilitas}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Informasi Peminjaman</h3>
        <table>
          <tbody>
            <tr>
              <td>Tanggal Mulai</td>
              <td>: {disposisi.tanggal_mulai}</td>
            </tr>
            <tr>
              <td>Tanggal Selesai</td>
              <td>: {disposisi.tanggal_selesai}</td>
            </tr>
            <tr>
              <td>Waktu</td>
              <td>: {disposisi.waktu_mulai} - {disposisi.waktu_selesai}</td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {disposisi.keperluan}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>: <span className={`status-badge ${disposisi.status_disposisi}`}>{disposisi.status_disposisi}</span></td>
            </tr>
            {disposisi.status_disposisi === 'ditolak' && (
              <tr>
                <td>Catatan</td>
                <td>: {disposisi.catatan}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Dokumen</h3>
        {disposisi.surat_peminjaman ? (
          <div className="document-preview">
            <p>Nama File: {disposisi.surat_peminjaman}</p>
            <div className="document-actions">
              <a 
                href={`http://localhost:5000/uploads/${disposisi.surat_peminjaman}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fas fa-download"></i> Unduh Surat
              </a>
              {disposisi.surat_peminjaman.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`http://localhost:5000/uploads/${disposisi.surat_peminjaman}#toolbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                  style={{ marginTop: '10px', border: '1px solid #ddd' }}
                />
              ) : (
                <img 
                  src={`http://localhost:5000/uploads/${disposisi.surat_peminjaman}`}
                  alt="Preview Surat"
                  style={{ maxWidth: '100%', marginTop: '10px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.png';
                    console.log('Error loading image:', disposisi.surat_peminjaman);
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
            <button
              className="btn-approve"
              onClick={() => handleStatusUpdate('disetujui')}
            >
              <i className="fas fa-check"></i>
              Setujui
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
        <button
          className="btn-back"
          onClick={() => navigate('/dashboard-wadek/disposisi')}
        >
          <i className="fas fa-arrow-left"></i>
          Kembali
        </button>
      </div>

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
                rows="4"
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
                onClick={() => setRejectComment('')}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  handleReject();
                  const modal = bootstrap.Modal.getInstance(document.getElementById('rejectModal'));
                  modal.hide();
                }}
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

function RiwayatPeminjaman() {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const response = await axios.get("http://localhost:5000/peminjaman");
        const filteredRiwayat = response.data.filter(
          (item) => item.status === "selesai" // Filter hanya peminjaman yang selesai
        );
        setRiwayat(filteredRiwayat);
      } catch (err) {
        setError("Gagal mengambil data riwayat aktivitas");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiwayat();
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-4">Riwayat Peminjaman</h1>

      {loading ? (
        <p>Memuat data riwayat...</p>
      ) : error ? (
        <p className="text-danger">{error}</p>
      ) : riwayat.length === 0 ? (
        <p>Tidak ada aktivitas yang telah selesai.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead className="table-light">
              <tr>
                <th>Nama Organisasi</th>
                <th>Penanggung Jawab</th>
                <th>Nama Fasilitas</th>
                <th>Tanggal Mulai</th>
                <th>Tanggal Selesai</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((item, index) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>{item.tanggal_mulai}</td>
                  <td>{item.tanggal_selesai}</td>
                  <td>{item.waktu_mulai}</td>
                  <td>{item.waktu_selesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
