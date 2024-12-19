import { useState, useEffect } from 'react';
import axios from 'axios';
import '../disc/css/components/NotificationComponents.css';

const NotificationComponents = () => {
  const [peminjaman, setPeminjaman] = useState([]);
  const [perizinan, setPerizinan] = useState([]);
  const [loadingPeminjaman, setLoadingPeminjaman] = useState(true);
  const [loadingPerizinan, setLoadingPerizinan] = useState(true);
  const [errorPeminjaman, setErrorPeminjaman] = useState(null);
  const [errorPerizinan, setErrorPerizinan] = useState(null);

  // Pagination state
  const [currentPagePeminjaman, setCurrentPagePeminjaman] = useState(1);
  const [currentPagePerizinan, setCurrentPagePerizinan] = useState(1);

  const ITEMS_PER_PAGE = 5;

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      fetchPeminjaman();
      fetchPerizinan();
    }
  }, [isLoggedIn, userEmail]);

  const fetchPeminjaman = async () => {
    try {
      setLoadingPeminjaman(true);
      const response = await axios.get(`http://localhost:5000/peminjaman/user/${userEmail}`);
      const sortedPeminjaman = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPeminjaman(sortedPeminjaman);
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
      setErrorPeminjaman(error.message);
    } finally {
      setLoadingPeminjaman(false);
    }
  };

  const fetchPerizinan = async () => {
    try {
      setLoadingPerizinan(true);
      const response = await axios.get(`http://localhost:5000/izin-kegiatan/user/${userEmail}`);
      const sortedPerizinan = response.data.sort(
        (a, b) => new Date(b.tanggal_permintaan) - new Date(a.tanggal_permintaan)
      );
      setPerizinan(sortedPerizinan);
    } catch (error) {
      console.error('Error fetching perizinan:', error);
      setErrorPerizinan(error.message);
    } finally {
      setLoadingPerizinan(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'pending',
      disetujui: 'disetujui',
      ditolak: 'ditolak',
      disposisi: 'disposisi',
    };
    return badges[status] || 'pending';
  };

  const renderStatusCards = (items, type) => (
    <div className="notifications-wrapper">
      {items.map((item) => (
        <div key={item.id} className="notification-card">
          <div className="notification-header">
            <h5 className="facility-name">
              {type === 'peminjaman' ? item.nama_fasilitas : item.nama_organisasi}
            </h5>
            <span className={`status-badge ${getStatusBadge(item.status)}`}>
              {item.status || 'pending'}
            </span>
          </div>
          <div className="notification-body">
            <div className="info-row">
              <span className="label">Organisasi:</span>
              <span className="value">{item.nama_organisasi}</span>
            </div>
            <div className="info-row">
              <span className="label">
                {type === 'peminjaman' ? `Tanggal:` : `Tanggal Permintaan:`}
              </span>
              <span className="value">
                {type === 'peminjaman'
                  ? `${item.tanggal_mulai} - ${item.tanggal_selesai}`
                  : new Date(item.tanggal_permintaan).toLocaleDateString('id-ID')}
              </span>
            </div>
            {type === 'peminjaman' ? (
              <>
                <div className="info-row">
                  <span className="label">Waktu:</span>
                  <span className="value">{item.waktu_mulai} - {item.waktu_selesai}</span>
                </div>
                <div className="info-row">
                  <span className="label">Keperluan:</span>
                  <span className="value">{item.keperluan}</span>
                </div>
              </>
            ) : (
              <div className="info-row">
                <span className="label">Keperluan:</span>
                <span className="value">{item.keperluan}</span>
              </div>
            )}
            {item.status === 'ditolak' && item.komentar && (
              <div className="info-row">
                <span className="label text-danger">Alasan Ditolak:</span>
                <span className="value text-danger">{item.komentar}</span>
              </div>
            )}
          </div>
          <div className="notification-footer">
            <small className="timestamp">
              Diajukan pada: {new Date(type === 'peminjaman' ? item.created_at : item.tanggal_permintaan).toLocaleString()}
            </small>
          </div>
        </div>
      ))}
    </div>
  );

  const handlePageChange = (page, type) => {
    if (type === 'peminjaman') {
      setCurrentPagePeminjaman(page);
    } else {
      setCurrentPagePerizinan(page);
    }
  };

  const paginateItems = (items, currentPage) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = currentPage * ITEMS_PER_PAGE;
    return items.slice(start, end);
  };

  const renderPagination = (items, currentPage, type) => {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    return (
      <nav aria-label="Pagination">
        <ul className="pagination justify-content-center">
          {[...Array(totalPages).keys()].map((pageNumber) => (
            <li
              key={pageNumber}
              className={`page-item ${currentPage === pageNumber + 1 ? 'active' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(pageNumber + 1, type)}
              >
                {pageNumber + 1}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Silakan login terlebih dahulu untuk melihat status peminjaman dan perizinan Anda
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h4 className="notification-title fw-semibold">Dashboard Status</h4>
      <div className="row">
        <div className="col-6">
          <div className="status-section">
            <h4 className="section-title">Status Perizinan</h4>
            {loadingPerizinan ? (
              <div className="notification-alert info">Memuat status perizinan...</div>
            ) : errorPerizinan ? (
              <div className="notification-alert error">{errorPerizinan}</div>
            ) : perizinan.length === 0 ? (
              <div className="notification-alert info">Belum ada perizinan</div>
            ) : (
              <>
                {renderStatusCards(paginateItems(perizinan, currentPagePerizinan), 'perizinan')}
              </>
            )}
          </div>
        </div>
        <div className="col-6">
          <div className="status-section">
            <h4 className="section-title">Status Peminjaman</h4>
            {loadingPeminjaman ? (
              <div className="notification-alert info">Memuat status peminjaman...</div>
            ) : errorPeminjaman ? (
              <div className="notification-alert error">{errorPeminjaman}</div>
            ) : peminjaman.length === 0 ? (
              <div className="notification-alert info">Belum ada peminjaman</div>
            ) : (
              <>
                {renderStatusCards(paginateItems(peminjaman, currentPagePeminjaman), 'peminjaman')}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pagination - status perizinan and peminjaman */}
      <div className="row mt-5">
        <div className="col-6 text-center">
          {renderPagination(perizinan, currentPagePerizinan, 'perizinan')}
        </div>
        <div className="col-6 text-center">
          {renderPagination(peminjaman, currentPagePeminjaman, 'peminjaman')}
        </div>
      </div>
    </div>
  );
};

export default NotificationComponents;
