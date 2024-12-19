import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaClipboardList,
  FaBuilding,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import "../disc/css/main.css";
import axios from "axios";

export function DashboardDekan() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!isSidebarOpen ? "closed" : ""}`}>
        <div className="sidebar-header">
          <h2>Dashboard Dekan</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to=""
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaTachometerAlt className="me-2" />
            <span>Beranda</span>
          </NavLink>

          <NavLink
            to="peminjaman"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaClipboardList className="me-2" />
            <span>Daftar Peminjaman</span>
          </NavLink>

          <NavLink
            to="izin-kegiatan"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaClipboardList className="me-2" />
            <span>Daftar Perizinan</span>
          </NavLink>

          <NavLink
            to="fasilitas"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaBuilding className="me-2" />
            <span>Manajemen Fasilitas</span>
          </NavLink>

          <NavLink
            to="riwayat"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <FaHistory className="me-2" />
            <span>Riwayat Aktivitas</span>
          </NavLink>

          <button
            className="nav-item logout-button"
            onClick={() => {
              // Hapus data di localStorage
              localStorage.removeItem("userRole");
              localStorage.removeItem("userEmail");
              localStorage.removeItem("isLoggedIn");
              // Arahkan ke halaman login
              window.location.href = "/login";
            }}
            style={{
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaSignOutAlt className="me-2" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <main className={`dashboard-main ${!isSidebarOpen ? "full" : ""}`}>
        <button
          className="toggle-sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? "←" : "→"}
        </button>

        <Routes>
          <Route index element={<BerandaDekan />} />
          <Route path="peminjaman" element={<DaftarPeminjaman />} />
          <Route path="izin-kegiatan" element={<DaftarPerizinan />} />
          <Route path="peminjaman/:id" element={<DetailPeminjaman />} />
          <Route path="izin-kegiatan/:id" element={<DetailPerizinan />} />
          <Route path="fasilitas" element={<ManajemenFasilitas />} />
          <Route path="riwayat" element={<RiwayatAktivitas />} />
        </Routes>
      </main>
    </div>
  );
}

function BerandaDekan() {
  const [stats, setStats] = useState({
    pending: 0,
    disetujui: 0,
    ditolak: 0,
    disposisi: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disposisi, setDisposisi] = useState([]);
  const [izinStats, setIzinStats] = useState({
    pending: 0,
    disetujui: 0,
    ditolak: 0,
    disposisi: 0,
  });

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchDisposisi();
    fetchIzinKegiatan();
  }, []);

  const fetchStats = async () => {
    try {
      const [peminjamanRes, disposisiRes] = await Promise.all([
        fetch("http://localhost:5000/peminjaman"),
        fetch("http://localhost:5000/disposisi"),
      ]);

      const [peminjamanData, disposisiData] = await Promise.all([
        peminjamanRes.json(),
        disposisiRes.json(),
      ]);

      const stats = {
        pending: peminjamanData.filter(
          (p) => !p.status || p.status === "pending"
        ).length,
        disetujui: peminjamanData.filter((p) => p.status === "disetujui")
          .length,
        ditolak: peminjamanData.filter((p) => p.status === "ditolak").length,
        disposisi: disposisiData.filter((d) => d.status_disposisi === "pending")
          .length,
      };

      setStats(stats);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const peminjamanRes = await fetch("http://localhost:5000/peminjaman");
      const peminjamanData = await peminjamanRes.json();

      // Urutkan peminjaman berdasarkan created_at (terbaru ke terlama)
      const sortedPeminjaman = peminjamanData.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      const notifications = sortedPeminjaman
        .map((p) => ({
          id: `peminjaman-${p.id}`,
          icon: getStatusIcon(p.status),
          nama_organisasi: p.nama_organisasi,
          nama_fasilitas: p.nama_fasilitas,
          status: p.status || "pending",
          penanggung_jawab: p.penanggung_jawab,
          created_at: p.created_at,
        }))
        .reverse();

      setNotifications(notifications);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisposisi = async () => {
    try {
      const response = await fetch("http://localhost:5000/disposisi");
      const disposisiData = await response.json();

      // Urutkan disposisi berdasarkan created_at (terbaru ke terlama)
      const sortedDisposisi = disposisiData.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Mengambil detail peminjaman untuk 5 disposisi terbaru
      const disposisiWithDetails = await Promise.all(
        sortedDisposisi.slice(0, 5).map(async (item) => {
          const peminjamanRes = await fetch(
            `http://localhost:5000/peminjaman/${item.id_peminjaman}`
          );
          const peminjamanData = await peminjamanRes.json();
          return { ...item, peminjaman: peminjamanData };
        })
      );

      setDisposisi(disposisiWithDetails);
    } catch (error) {
      console.error("Error fetching disposisi:", error);
    }
  };

  const fetchIzinKegiatan = async () => {
    try {
      const response = await fetch("http://localhost:5000/izin-kegiatan");
      const data = await response.json();

      const stats = {
        pending: data.filter((izin) => izin.status === "pending").length,
        disetujui: data.filter((izin) => izin.status === "disetujui").length,
        ditolak: data.filter((izin) => izin.status === "ditolak").length,
        disposisi: data.filter((izin) => izin.status === "disposisi").length,
      };

      setIzinStats(stats);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "clock";
      case "disetujui":
        return "check-circle";
      case "ditolak":
        return "times-circle";
      case "disposisi":
        return "exchange-alt";
      default:
        return "bell";
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
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Pending</h3>
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

        <div className="stat-card">
          <div className="stat-icon disposisi">
            <FaExchangeAlt />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Didisposisi</h3>
            <div className="value">{stats.disposisi}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Izin Kegiatan Pending</h3>
            <div className="value">{izinStats.pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Izin Kegiatan Disetujui</h3>
            <div className="value">{izinStats.disetujui}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rejected">
            <FaTimesCircle />
          </div>
          <div className="stat-info">
            <h3>Izin Kegiatan Ditolak</h3>
            <div className="value">{izinStats.ditolak}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon disposisi">
            <FaExchangeAlt />
          </div>
          <div className="stat-info">
            <h3>Izin Kegiatan Didisposisi</h3>
            <div className="value">{izinStats.disposisi}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Peminjaman Terbaru</h2>
          </div>
          <div className="peminjaman-list">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4 className="fw-bold">{notif.nama_organisasi}</h4>
                  <div className="peminjaman-details">
                    <span>
                      <i className="fas fa-building"></i> {notif.nama_fasilitas}
                    </span>
                  </div>
                  <span className={`status-badge ${notif.status}`}>
                    {notif.status === "pending"
                      ? "Menunggu Persetujuan"
                      : notif.status === "disetujui"
                      ? "Disetujui"
                      : notif.status === "ditolak"
                      ? "Ditolak"
                      : notif.status === "disposisi"
                      ? "Didisposisi"
                      : notif.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card disposisi-terbaru">
          <div className="card-header">
            <h2>Disposisi Terbaru</h2>
          </div>
          <div className="disposisi-list">
            {disposisi.length > 0 ? (
              disposisi.map((item) => (
                <div key={item.id} className="disposisi-item">
                  <div className="disposisi-header">
                    <span className="org-name">
                      Disposisi ke {item.kepada.replace("_", " ")}
                    </span>
                  </div>
                  <div className="peminjaman-info">
                    <span>Peminjaman: </span>
                    <span>
                      {item.peminjaman?.nama_organisasi} -{" "}
                      {item.peminjaman?.nama_fasilitas}
                    </span>
                  </div>
                  <div className="disposisi-info">
                    <div className="time-info">
                      <span>Waktu Disposisi: </span>
                      <span>
                        {new Date(
                          new Date(item.created_at).getTime() +
                            8 * 60 * 60 * 1000
                        ).toLocaleString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZoneName: "short",
                        })}
                      </span>
                    </div>
                    <span className={`status-badge ${item.status_disposisi}`}>
                      {item.status_disposisi}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">Tidak ada disposisi terbaru</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaftarPeminjaman() {
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "semua",
    tanggal: "",
    keyword: "",
  });
  const [rejectComment, setRejectComment] = useState("");
  const [selectedPeminjamanId, setSelectedPeminjamanId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // State untuk pesan toast

  useEffect(() => {
    fetchPeminjaman();
  }, [filter]);

  const fetchPeminjaman = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/peminjaman");
      const data = await response.json();

      // Periksa setiap peminjaman dan filter data
      const updatedPeminjaman = await Promise.all(
        data.map(async (item) => {
          // Periksa hanya yang statusnya 'disetujui' dan bukan sudah selesai
          if (item.status === "selesai") return null;

          // Hanya memeriksa peminjaman yang statusnya 'disetujui'
          if (item.status === "disetujui") {
            const waktuSelesai = new Date(
              `${item.tanggal_selesai}T${item.waktu_selesai}`
            );

            // Periksa apakah waktu selesai sudah terlewati
            const currentDate = new Date();
            if (waktuSelesai < currentDate) {
              // Update status ke 'selesai' jika waktu selesai telah terlewati
              await handleStatusUpdate(item.id, "selesai");
              return null;
            }
          }

          return item; // Kembalikan item yang statusnya tidak perlu diubah
        })
      );

      // Filter data berdasarkan filter.status, filter.tanggal, dan filter.keyword
      const filteredPeminjaman = updatedPeminjaman
        .filter(Boolean)
        .filter((item) => {
          const filterTanggal = filter.tanggal
            ? new Date(filter.tanggal)
            : null;
          const itemTanggal = new Date(item.tanggal_mulai);

          const statusMatch =
            filter.status === "semua" || item.status === filter.status;
          const tanggalMatch = filterTanggal
            ? itemTanggal.toDateString() === filterTanggal.toDateString()
            : true;

          const keywordMatch = filter.keyword
            ? item.nama_organisasi
                .toLowerCase()
                .includes(filter.keyword.toLowerCase()) ||
              item.nama_fasilitas
                .toLowerCase()
                .includes(filter.keyword.toLowerCase())
            : true;

          return statusMatch && tanggalMatch && keywordMatch;
        });

      // Urutkan data berdasarkan waktu terbaru
      const sortedPeminjaman = filteredPeminjaman
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .reverse();

      setPeminjaman(sortedPeminjaman);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus, komentar = "") => {
    try {
      const response = await fetch(
        `http://localhost:5000/peminjaman/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, komentar }),
        }
      );

      if (response.ok) {
        console.log(`Status peminjaman ${id} diperbarui menjadi ${newStatus}`);
        setToastMessage("Peminjaman Disetujui");
        fetchPeminjaman();
      } else {
        console.error("Gagal memperbarui status:", await response.text());
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openRejectModal = (id) => {
    setSelectedPeminjamanId(id);
  };

  const closeRejectModal = () => {
    setRejectComment("");
    setSelectedPeminjamanId(null);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert("Harap isi alasan penolakan.");
      return;
    }

    await handleStatusUpdate(selectedPeminjamanId, "ditolak", rejectComment);

    // Tampilkan notifikasi
    setToastMessage("Peminjaman Ditolak");

    // Tutup modal dan reset nilai
    closeRejectModal();
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null); // Hide toast after 5 seconds
      }, 5000);

      // Clear the timeout if the component is unmounted or toastMessage changes
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Peminjaman</h1>
      <div className="filter-container mb-4">
        <div className="filter-group">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="form-select"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="disposisi">Disposisi</option>
          </select>

          <input
            type="date"
            value={filter.tanggal}
            onChange={(e) => setFilter({ ...filter, tanggal: e.target.value })}
            className="form-control"
          />

          <input
            type="text"
            placeholder="Cari Organisasi/Fasilitas"
            value={filter.keyword}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            className="form-control"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Memuat data peminjaman...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Organisasi</th>
                <th>Penanggung Jawab</th>
                <th>Fasilitas</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peminjaman.map((item) => (
                <tr key={item.id}>
                  <td>{item.nama_organisasi}</td>
                  <td>{item.penanggung_jawab}</td>
                  <td>{item.nama_fasilitas}</td>
                  <td>
                    {new Date(item.tanggal_mulai).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(item.tanggal_selesai).toLocaleDateString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                    <br />
                    <small>
                      {item.waktu_mulai} - {item.waktu_selesai}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge bg-${
                        item.status === "disetujui" ? "success" : "warning"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-detail"
                        onClick={() =>
                          navigate(`/dashboard-dekan/peminjaman/${item.id}`)
                        }
                      >
                        <i className="fas fa-eye"></i>
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              <h5 className="modal-title" id="rejectModalLabel">
                Alasan Penolakan
              </h5>
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
                onClick={closeRejectModal}
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
    </div>
  );
}

function DetailPeminjaman() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [peminjaman, setPeminjaman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [komentar, setKomentar] = useState(""); // Untuk komentar penolakan
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/peminjaman/${id}`);
        if (!response.ok) {
          throw new Error("Data tidak ditemukan");
        }
        const data = await response.json();
        setPeminjaman(data);
      } catch (error) {
        console.error("Error:", error);
        alert("Gagal mengambil data peminjaman");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fungsi untuk mengubah status peminjaman
  const handleStatusUpdate = async (newStatus, komentar = "") => {
    try {
      const response = await fetch(
        `http://localhost:5000/peminjaman/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, komentar }),
        }
      );

      if (response.ok) {
        setToastMessage(
          `Peminjaman berhasil ${
            newStatus === "disetujui" ? "disetujui" : "ditolak"
          }`
        );
        // Refresh data peminjaman
        const updatedResponse = await fetch(
          `http://localhost:5000/peminjaman/${id}`
        );
        const updatedData = await updatedResponse.json();
        setPeminjaman(updatedData);
      }
    } catch (error) {
      console.error("Error:", error);
      setToastMessage("Gagal memperbarui status peminjaman");
    }
  };

  // Fungsi untuk menolak peminjaman
  const handleReject = async () => {
    if (!komentar.trim()) {
      alert("Harap isi alasan penolakan.");
      return;
    }

    await handleStatusUpdate("ditolak", komentar);

    // Tutup modal Bootstrap secara manual
    const modalElement = document.getElementById("rejectModal");
    const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }

    setKomentar(""); // Reset komentar
  };

  const handleDisposisi = async () => {
    try {
      // Buat disposisi
      const disposisiResponse = await fetch(`http://localhost:5000/disposisi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_peminjaman: id,
          dari: "dekan",
          kepada: "wakil_dekan",
        }),
      });

      if (disposisiResponse.ok) {
        // Update status peminjaman menjadi 'disposisi'
        const statusResponse = await fetch(
          `http://localhost:5000/peminjaman/${id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "disposisi",
            }),
          }
        );

        if (statusResponse.ok) {
          alert("Berhasil mendisposisikan peminjaman");
          navigate("/dashboard-dekan/peminjaman");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mendisposisikan peminjaman");
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

  if (loading) {
    return <div>Memuat data...</div>;
  }

  if (!peminjaman) {
    return <div>Data tidak ditemukan</div>;
  }

  return (
    <div className="detail-container">
      <h2>Detail Peminjaman</h2>

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {peminjaman.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {peminjaman.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {peminjaman.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {peminjaman.email}</td>
            </tr>
            <tr>
              <td>Fasilitas</td>
              <td>: {peminjaman.nama_fasilitas}</td>
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
              <td>: {peminjaman.tanggal_mulai}</td>
            </tr>
            <tr>
              <td>Tanggal Selesai</td>
              <td>: {peminjaman.tanggal_selesai}</td>
            </tr>
            <tr>
              <td>Waktu</td>
              <td>
                : {peminjaman.waktu_mulai} - {peminjaman.waktu_selesai}
              </td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {peminjaman.keperluan}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>
                :{" "}
                <span className={`status ${peminjaman.status}`}>
                  {peminjaman.status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="detail-section">
        <h3>Dokumen</h3>
        {peminjaman.surat_peminjaman ? (
          <div className="document-preview">
            <p>Nama File: {peminjaman.surat_peminjaman}</p>
            <div className="document-actions">
              <a
                href={`http://localhost:5000/uploads/${peminjaman.surat_peminjaman}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fas fa-download"></i> Unduh Surat
              </a>
              {peminjaman.surat_peminjaman.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`http://localhost:5000/uploads/${peminjaman.surat_peminjaman}#toolbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                  style={{ marginTop: "10px", border: "1px solid #ddd" }}
                />
              ) : (
                <img
                  src={`http://localhost:5000/uploads/${peminjaman.surat_peminjaman}`}
                  alt="Preview Surat"
                  style={{ maxWidth: "100%", marginTop: "10px" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder-image.png";
                    console.log(
                      "Error loading image:",
                      peminjaman.surat_peminjaman
                    );
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
        <button
          onClick={() => navigate("/dashboard-dekan/peminjaman")}
          className="btn-back"
        >
          <i className="fas fa-arrow-left"></i>
          Kembali
        </button>

        {/* Tambahkan tombol Setujui dan Tolak jika status pending */}
        {peminjaman?.status === "pending" && (
          <>
            <button
              className="btn-reject"
              data-bs-toggle="modal"
              data-bs-target="#rejectModal"
            >
              <i className="fas fa-times"></i>
              Tolak Peminjaman
            </button>
            <button
              onClick={() => handleStatusUpdate("disetujui")}
              className="btn-approve"
            >
              <i className="fas fa-check"></i>
              Setujui Peminjaman
            </button>
            <button onClick={handleDisposisi} className="btn-disposisi">
              <i className="fas fa-exchange-alt"></i>
              Disposisi ke Wakil Dekan
            </button>
          </>
        )}
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
              <h5 className="modal-title" id="rejectModalLabel">
                Alasan Penolakan
              </h5>
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
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setKomentar("")}
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
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
            <div className="toast-body">{toastMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManajemenFasilitas() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nama_fasilitas: "",
    kapasitas: "",
    gedung: "",
    lantai: "",
    images: [],
    originalFileNames: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // State untuk pesan toast

  // Fetch data fasilitas
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/fasilitas");
      setFacilities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error:", error);
      setError("Gagal mengambil data fasilitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Handle file input
  const handleFileChange = (index, file) => {
    if (file) {
      console.log(`Processing new file for index ${index}:`, file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => {
          const newImages = [...prev.images];
          const newFileNames = [...prev.originalFileNames];
          newImages[index] = reader.result;
          newFileNames[index] = file.name;

          console.log(`Updated state for index ${index}:`, {
            fileName: file.name,
            imageDataLength: reader.result.length,
          });

          return {
            ...prev,
            images: newImages,
            originalFileNames: newFileNames,
          };
        });
      };
      reader.onerror = () => {
        console.error(`Error reading file at index ${index}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nama_fasilitas", formData.nama_fasilitas);
      formDataToSend.append("kapasitas", formData.kapasitas);
      formDataToSend.append("gedung", formData.gedung);
      formDataToSend.append("lantai", formData.lantai);

      // Handle gambar
      for (let i = 0; i < 3; i++) {
        const image = formData.images[i];
        const fieldName = `image${i + 1}`;

        if (image) {
          if (image.startsWith("data:")) {
            // Konversi base64 ke blob
            const response = await fetch(image);
            const blob = await response.blob();

            // Gunakan nama file asli dari originalFileNames
            const fileName =
              formData.originalFileNames[i] || `image${i + 1}.jpg`;
            formDataToSend.append(fieldName, blob, fileName);
          } else {
            // Gambar existing, kirim nama file saja
            formDataToSend.append(fieldName, image);
          }
        }
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      let response;
      if (editingId) {
        response = await axios.put(
          `http://localhost:5000/fasilitas/${editingId}`,
          formDataToSend,
          config
        );
        if (response.data.message === "Fasilitas berhasil diupdate") {
          setShowModal(false);
          setFormData({
            nama_fasilitas: "",
            kapasitas: "",
            gedung: "",
            lantai: "",
            images: [],
            originalFileNames: [],
          });
          setEditingId(null);
          await fetchFacilities();
          setToastMessage("Fasilitas berhasil diupdate!"); // Menampilkan pesan toast
        }
      } else {
        response = await axios.post(
          "http://localhost:5000/fasilitas",
          formDataToSend,
          config
        );
        if (response.data.message === "Fasilitas berhasil ditambahkan") {
          setShowModal(false);
          setFormData({
            nama_fasilitas: "",
            kapasitas: "",
            gedung: "",
            lantai: "",
            images: [],
            originalFileNames: [],
          });
          await fetchFacilities();
          setToastMessage("Fasilitas berhasil ditambahkan!"); // Menampilkan pesan toast
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setToastMessage("Gagal menyimpan fasilitas."); // Menampilkan pesan error pada toast
    }
  };

  // Handle hapus fasilitas
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/fasilitas/${id}`
        );

        if (response.data.message === "Fasilitas berhasil dihapus") {
          setToastMessage("Fasilitas berhasil dihapus"); // Menampilkan pesan toast
          await fetchFacilities();
        } else {
          setToastMessage(response.data.error); // Menampilkan error yang dikirim dari backend
        }
      } catch (error) {
        console.error("Error saat menghapus:", error);
        setToastMessage("Terjadi kesalahan saat menghapus fasilitas."); // Menampilkan pesan error pada toast
      }
    }
  };

  // Handle edit fasilitas
  const handleEdit = (facility) => {
    console.log("Data fasilitas sebelum edit:", facility);
    const imageArray = [facility.image, facility.image2, facility.image3];
    console.log("Array gambar yang akan di-set:", imageArray);

    setFormData({
      nama_fasilitas: facility.nama_fasilitas,
      kapasitas: facility.kapasitas,
      gedung: facility.gedung,
      lantai: facility.lantai,
      images: imageArray,
      originalFileNames: [facility.image, facility.image2, facility.image3],
    });
    setEditingId(facility.id);
    setShowModal(true);
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null); // Hide toast after 5 seconds
      }, 5000);

      // Clear the timeout if the component is unmounted or toastMessage changes
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-card">
      <div className="card-header mb-3">
        <h2>Kelola Fasilitas</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({
              nama_fasilitas: "",
              kapasitas: "",
              images: [],
              originalFileNames: [],
            });
            setEditingId(null);
            setShowModal(true);
          }}
        >
          + Tambah Fasilitas
        </button>
      </div>

      {/* Modal Form */}
      <div className={`facility-modal ${showModal ? "show" : ""}`}>
        <div className="facility-modal-dialog">
          <div className="facility-modal-content">
            <div className="facility-modal-header">
              <h5 className="facility-modal-title">
                {editingId ? "Edit Fasilitas" : "Tambah Fasilitas"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    nama_fasilitas: "",
                    kapasitas: "",
                    images: [],
                    originalFileNames: [],
                  });
                  setEditingId(null);
                }}
              />
            </div>
            <div className="facility-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="facility-form-group">
                  <label>Nama Fasilitas:</label>
                  <input
                    type="text"
                    value={formData.nama_fasilitas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nama_fasilitas: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Kapasitas:</label>
                  <input
                    type="number"
                    value={formData.kapasitas}
                    onChange={(e) =>
                      setFormData({ ...formData, kapasitas: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Gedung:</label>
                  <input
                    type="text"
                    value={formData.gedung}
                    onChange={(e) =>
                      setFormData({ ...formData, gedung: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Lantai:</label>
                  <input
                    type="number"
                    value={formData.lantai}
                    onChange={(e) =>
                      setFormData({ ...formData, lantai: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="facility-form-group">
                  <label>Gambar Fasilitas (Maksimal 3):</label>
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="mb-3">
                      <label>Gambar {index}:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(index - 1, e.target.files[0])
                        }
                      />
                      {formData.images[index - 1] && (
                        <div className="image-preview">
                          <img
                            src={
                              formData.images[index - 1].startsWith("data:")
                                ? formData.images[index - 1]
                                : `http://localhost:5000/uploads/fasilitas/${
                                    formData.images[index - 1]
                                  }`
                            }
                            alt={`Preview ${index}`}
                            style={{
                              maxWidth: "200px",
                              maxHeight: "150px",
                              marginTop: "10px",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="facility-modal-footer">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? "Update" : "Simpan"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Fasilitas */}
      {facilities.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Fasilitas</th>
                <th>Kapasitas</th>
                <th>Gedung</th>
                <th>Lantai</th>
                <th>Gambar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td>{facility.nama_fasilitas}</td>
                  <td>{facility.kapasitas} Orang</td>
                  <td>{facility.gedung}</td>
                  <td>{facility.lantai}</td>
                  <td>
                    {facility.image && (
                      <img
                        src={`http://localhost:5000/uploads/fasilitas/${facility.image}`}
                        alt={facility.nama_fasilitas}
                        className="facility-image"
                        style={{
                          width: "100px",
                          height: "60px",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "placeholder.jpg";
                        }}
                      />
                    )}
                    {(facility.image2 || facility.image3) && (
                      <span className="badge bg-info ms-2">
                        +
                        {
                          [facility.image2, facility.image3].filter(
                            (img) => img !== null
                          ).length
                        }
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="editBtn"
                        onClick={() => handleEdit(facility)}
                      >
                        <svg height="1em" viewBox="0 0 512 512">
                          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                        </svg>
                      </button>
                      <button
                        className="bin-button"
                        onClick={() => handleDelete(facility.id)}
                      >
                        <svg
                          className="bin-top"
                          viewBox="0 0 39 7"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line
                            y1="5"
                            x2="39"
                            y2="5"
                            stroke="white"
                            strokeWidth="4"
                          ></line>
                          <line
                            x1="12"
                            y1="1.5"
                            x2="26.0357"
                            y2="1.5"
                            stroke="white"
                            strokeWidth="3"
                          ></line>
                        </svg>
                        <svg
                          className="bin-bottom"
                          viewBox="0 0 33 39"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <mask
                            id={`path-1-inside-1_8_19_${facility.id}`}
                            fill="white"
                          >
                            <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                          </mask>
                          <path
                            d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                            fill="white"
                            mask={`url(#path-1-inside-1_8_19_${facility.id})`}
                          ></path>
                          <path
                            d="M12 6L12 29"
                            stroke="white"
                            strokeWidth="4"
                          ></path>
                          <path
                            d="M21 6V29"
                            stroke="white"
                            strokeWidth="4"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">Tidak ada data fasilitas</div>
      )}

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
    </div>
  );
}

function RiwayatAktivitas() {
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
      <h1 className="mb-4">Riwayat Aktivitas</h1>

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
                  <td>
                    {new Date(item.tanggal_mulai).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    {new Date(item.tanggal_selesai).toLocaleDateString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </td>
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

function DaftarPerizinan() {
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "semua",  // Set default filter status ke "semua"
    tanggal: "",
    keyword: "",
  });
  const [rejectComment, setRejectComment] = useState("");
  const [selectedPeminjamanId, setSelectedPeminjamanId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null); // State untuk pesan toast

  useEffect(() => {
    fetchPerizinan();
  }, [filter]);

  const fetchPerizinan = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/izin-kegiatan");
      const data = await response.json();

      // Filter data berdasarkan filter.status, filter.tanggal, dan filter.keyword
      const filteredPerizinan = data.filter((item) => {
        const statusMatch =
          filter.status === "semua" || item.status === filter.status;
        const tanggalMatch = filter.tanggal
          ? new Date(item.tanggal).toDateString() ===
            new Date(filter.tanggal).toDateString()
          : true;
        const keywordMatch = filter.keyword
          ? item.nama_kegiatan
              .toLowerCase()
              .includes(filter.keyword.toLowerCase()) ||
            item.nama_organisasi
              .toLowerCase()
              .includes(filter.keyword.toLowerCase())
          : true;

        return statusMatch && tanggalMatch && keywordMatch;
      });

      setPerizinan(filteredPerizinan);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus, komentar = "") => {
    try {
      const response = await fetch(
        `http://localhost:5000/peminjaman/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, komentar }),
        }
      );

      if (response.ok) {
        console.log(`Status peminjaman ${id} diperbarui menjadi ${newStatus}`);
        setToastMessage("Peminjaman Disetujui");
        fetchPerizinan();
      } else {
        console.error("Gagal memperbarui status:", await response.text());
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openRejectModal = (id) => {
    setSelectedPeminjamanId(id);
  };

  const closeRejectModal = () => {
    setRejectComment("");
    setSelectedPeminjamanId(null);
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert("Harap isi alasan penolakan.");
      return;
    }

    await handleStatusUpdate(selectedPeminjamanId, "ditolak", rejectComment);

    // Tampilkan notifikasi
    setToastMessage("Peminjaman Ditolak");

    // Tutup modal dan reset nilai
    closeRejectModal();
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null); // Hide toast after 5 seconds
      }, 5000);

      // Clear the timeout if the component is unmounted or toastMessage changes
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Daftar Perizinan</h1>

      <div className="filter-container mb-4">
        <div className="filter-group">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="form-select"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="disposisi">Disposisi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Memuat data perizinan...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Organisasi</th>
                <th>Penanggung Jawab</th>
                <th>Keperluan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {perizinan.length > 0 ? (
                perizinan
                  .sort(
                    (a, b) =>
                      new Date(b.tanggal_permintaan) -
                      new Date(a.tanggal_permintaan)
                  ) // Urutkan berdasarkan tanggal permintaan
                  .map((item) => (
                    <tr key={item.id}>
                      <td>{item.nama_organisasi}</td>
                      <td>{item.penanggung_jawab}</td>
                      <td>{item.keperluan}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            item.status === "disetujui"
                              ? "success"
                              : item.status === "ditolak"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-start">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              navigate(
                                `/dashboard-dekan/izin-kegiatan/${item.id}`
                              )
                            }
                          >
                            <i className="fas fa-eye"></i> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    Tidak ada perizinan untuk status ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
              <h5 className="modal-title" id="rejectModalLabel">
                Alasan Penolakan
              </h5>
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
                onClick={closeRejectModal}
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
    </div>
  );
}

function DetailPerizinan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [perizinan, setPerizinan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [komentar, setKomentar] = useState(""); // Untuk komentar penolakan
  const [toastMessage, setToastMessage] = useState(null); // State untuk pesan toast

  // Fetch data disposisi pada mount pertama dan saat 'id' berubah
  useEffect(() => {
    fetchDetailDisposisi();
  }, [id]);

  // Fungsi untuk memuat detail disposisi
  const fetchDetailDisposisi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/izin-kegiatan/${id}`);
      const data = await response.json();
      setPerizinan(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengubah status perizinan menjadi disetujui
  const handleApprove = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/izin-kegiatan/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "disetujui",
          }),
        }
      );

      if (response.ok) {
        setToastMessage("Perizinan berhasil disetujui");
        await fetchDetailDisposisi();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fungsi untuk mengubah status perizinan menjadi ditolak dan mengirim komentar
  const handleReject = async () => {
    if (komentar.trim() === "") {
      alert("Komentar tidak boleh kosong");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/izin-kegiatan/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "ditolak",
            komentar: komentar,
          }),
        }
      );

      if (response.ok) {
        setToastMessage("Perizinan berhasil ditolak");

        // Tutup modal Bootstrap secara manual
        const modalElement = document.getElementById("rejectModal");
        const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        }

        // Tunggu sedikit untuk memastikan modal tertutup
        setTimeout(() => {
          window.location.reload(); // Refresh halaman
        }, 300); // Timeout kecil untuk memastikan transisi modal selesai
      } else {
        throw new Error("Gagal menolak perizinan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menolak perizinan");
    }
  };

  const handleDisposisi = async () => {
    try {
      // Buat disposisi
      const disposisiResponse = await fetch(
        `http://localhost:5000/disposisi-kegiatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_izin_kegiatan: id,
            dari: "dekan",
            kepada: "wakil_dekan1", // Ganti kepada 'wakil_dekan1'
          }),
        }
      );

      if (disposisiResponse.ok) {
        // Update status perizinan menjadi 'disposisi'
        const statusResponse = await fetch(
          `http://localhost:5000/izin-kegiatan/${id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "disposisi",
            }),
          }
        );

        if (statusResponse.ok) {
          setToastMessage("Perizinan di Disposisi ke WD1");
          navigate("/dashboard-dekan/izin-kegiatan");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal mendisposisikan perizinan");
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

  if (loading) {
    return <div>Memuat data...</div>;
  }

  if (!perizinan) {
    return <div>Data tidak ditemukan</div>;
  }

  return (
    <div className="detail-container">
      <h2>Detail Perizinan</h2>

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

      <div className="detail-section">
        <h3>Informasi Pemohon</h3>
        <table>
          <tbody>
            <tr>
              <td>Nama Organisasi</td>
              <td>: {perizinan.nama_organisasi}</td>
            </tr>
            <tr>
              <td>Penanggung Jawab</td>
              <td>: {perizinan.penanggung_jawab}</td>
            </tr>
            <tr>
              <td>Kontak</td>
              <td>: {perizinan.kontak_pj}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>: {perizinan.email}</td>
            </tr>
            <tr>
              <td>Keperluan</td>
              <td>: {perizinan.keperluan}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>
                :{" "}
                <span className={`status ${perizinan.status}`}>
                  {perizinan.status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section Dokumen */}
      <div className="detail-section">
        <h3>Dokumen</h3>
        {perizinan.surat_perizinan ? (
          <div className="document-preview">
            <p>Nama File: {perizinan.surat_perizinan}</p>
            <div className="document-actions">
              <a
                href={`http://localhost:5000/uploads/${perizinan.surat_perizinan}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fas fa-download"></i> Unduh Surat
              </a>
              {perizinan.surat_perizinan.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`http://localhost:5000/uploads/${perizinan.surat_perizinan}#toolbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                  style={{ marginTop: "10px", border: "1px solid #ddd" }}
                />
              ) : (
                <img
                  src={`http://localhost:5000/uploads/${perizinan.surat_perizinan}`}
                  alt="Preview Surat"
                  style={{ maxWidth: "100%", marginTop: "10px" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder-image.png";
                    console.log(
                      "Error loading image:",
                      perizinan.surat_perizinan
                    );
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
        <button
          onClick={() => navigate("/dashboard-dekan/izin-kegiatan")}
          className="btn-back"
        >
          <i className="fas fa-arrow-left"></i>
          Kembali
        </button>

        {/* Tombol Disposisi hanya jika status perizinan "pending" */}
        {perizinan.status === "pending" && (
          <>
            <button
              className="btn-reject"
              data-bs-toggle="modal"
              data-bs-target="#rejectModal"
            >
              <i className="fas fa-times"></i>
              Tolak Perizinan
            </button>
            <button onClick={handleApprove} className="btn-approve">
              <i className="fas fa-check"></i>
              Setujui Perizinan
            </button>
            <button onClick={handleDisposisi} className="btn-disposisi">
              <i className="fas fa-exchange-alt"></i>
              Disposisi ke Wakil Dekan 1
            </button>
          </>
        )}
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
              <h5 className="modal-title" id="rejectModalLabel">
                Alasan Penolakan
              </h5>
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
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => setKomentar("")}
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
