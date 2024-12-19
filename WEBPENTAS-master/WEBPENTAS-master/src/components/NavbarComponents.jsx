import { FaBell, FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export const NavbarComponents = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    setIsLoggedIn(loginStatus === 'true');
    setUserRole(role || '');
    setUserEmail(email || '');
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
          const response = await axios.get(`http://localhost:5000/peminjaman/user/${userEmail}`);
          console.log('Response data:', response.data);
          
          const activeNotifications = response.data.filter(pinjam => {
            console.log('Status peminjaman:', pinjam.status);
            const status = pinjam.status?.toLowerCase() || 'pending';
            return status === 'pending' || status === 'disposisi';
          }).length;
          
          console.log('Active notifications count:', activeNotifications);
          setNotificationCount(activeNotifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserRole('');
    setUserEmail('');
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="">
       <div className="container-fluid">
       <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container">
            <a className="navbar-brand fw-bold d-flex align-items-center" href="#">
            <img src="public/logoUnhas.png" alt="." width="25" className="me-2" />
            <span className="my-auto">SIPANRITA</span>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
            <ul className="navbar-nav">
                <li className="nav-item">
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                >
                  Home
                </Link>
                </li>
                <li className="nav-item">
                <Link 
                  to="/izin-kegiatan" 
                  className={`nav-link ${location.pathname === "/izin-kegiatan" ? "active" : ""}`}
                >
                  Izin Kegiatan
                </Link>
                </li>
                <li className="nav-item">
                <Link 
                  to="/fasilitas" 
                  className={`nav-link ${location.pathname === "/fasilitas" ? "active" : ""}`}
                >
                  Fasilitas
                </Link>
                </li>
                <li className="nav-item">
                <Link to="/peminjaman" 
                className={`nav-link ${location.pathname === "/peminjaman" ? "active" : ""}`}
                >
                  Peminjaman
                </Link>
                </li>
                <li className="nav-item">
                <Link to="/contact" 
                className={`nav-link ${location.pathname === "/contact" ? "active" : ""}`}
                >
                  Kontak
                </Link>
                </li>
            </ul>
            </div>
            <div className="d-flex align-items-center gap-3">
              {isLoggedIn && (
                <Link to="/notifications" className="position-relative">
                  <FaBell size={20} className="text-dark" />
                  {notificationCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {notificationCount}
                      <span className="visually-hidden">notifikasi baru</span>
                    </span>
                  )}
                </Link>
              )}
              {isLoggedIn ? (
                <div className="dropdown">
                  <button 
                    className="btn btn-link text-dark p-0" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <FaUserCircle size={30} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><span className="dropdown-item-text fw-bold">{userEmail}</span></li>
                    <li><span className="dropdown-item-text">{userRole}</span></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-outline-danger"
                  onClick={handleLoginClick}
                >
                  Login
                </button>
              )}
            </div>
        </div>
        </nav>
       </div>
    </div>
  )
}
