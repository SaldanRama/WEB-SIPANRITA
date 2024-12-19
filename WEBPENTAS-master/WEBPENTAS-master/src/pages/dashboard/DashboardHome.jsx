import { useState, useEffect } from "react";
import {
  FaUsers,
  FaBuilding,
  FaCheckCircle,
  FaExclamationCircle,
  FaClipboardList,
} from "react-icons/fa";
import axios from "axios";

function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFacilities: 0,
    totalPeminjaman: 0,
    pendingPeminjaman: 0,
    totalIzinKegiatan: 0,
    pendingIzinKegiatan: 0,
  });

  const [recentData, setRecentData] = useState({
    peminjaman: [],
    facilities: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, facilitiesRes, peminjamanRes, izinKegiatanRes] =
          await Promise.all([
            axios.get("http://localhost:5000/users"),
            axios.get("http://localhost:5000/fasilitas"),
            axios.get("http://localhost:5000/peminjaman"),
            axios.get("http://localhost:5000/izin-kegiatan"),
          ]);

        setStats({
          totalUsers: usersRes.data.length,
          totalFacilities: facilitiesRes.data.length,
          totalPeminjaman: peminjamanRes.data.length,
          pendingPeminjaman: peminjamanRes.data.filter(
            (p) => p.status === "pending"
          ).length,
          totalIzinKegiatan: izinKegiatanRes.data.length,
          pendingIzinKegiatan: izinKegiatanRes.data.filter(
            (k) => k.status === "pending"
          ).length,
        });

        setRecentData({
          peminjaman: peminjamanRes.data.slice(-5).reverse(),
          facilities: facilitiesRes.data.slice(-5).reverse(),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-content">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>Total Pengguna</h3>
            <div className="value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon facilities">
            <FaBuilding />
          </div>
          <div className="stat-info">
            <h3>Total Fasilitas</h3>
            <div className="value">{stats.totalFacilities}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Total Peminjaman</h3>
            <div className="value">{stats.totalPeminjaman}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon inactive">
            <FaExclamationCircle />
          </div>
          <div className="stat-info">
            <h3>Peminjaman Pending</h3>
            <div className="value">{stats.pendingPeminjaman}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Total Izin Kegiatan</h3>
            <div className="value">{stats.totalIzinKegiatan}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <FaExclamationCircle />
          </div>
          <div className="stat-info">
            <h3>Izin Kegiatan Pending</h3>
            <div className="value">{stats.pendingIzinKegiatan}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Peminjaman Terbaru</h2>
          </div>
          <div className="peminjaman-list">
            {recentData.peminjaman.map((pinjam) => (
              <div key={pinjam.id} className="peminjaman-item">
                <div className="peminjaman-info">
                  <h4>{pinjam.nama_organisasi}</h4>
                  <p>
                    Tanggal:{" "}
                    {new Date(pinjam.tanggal_mulai).toLocaleDateString()}
                  </p>
                  <span className={`status-badge ${pinjam.status}`}>
                    {pinjam.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Fasilitas Terbaru</h2>
          </div>
          <div className="facility-list">
            {recentData.facilities.map((facility) => (
              <div key={facility.id} className="facility-item mb-2">
                <div className="facility-info">
                  <h4>{facility.nama_fasilitas}</h4>
                  <p>Kapasitas: {facility.kapasitas} orang</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
