import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { FaUsers, FaBuilding, FaTachometerAlt,FaSignOutAlt} from "react-icons/fa";
import UserManagement from "./dashboard/UserManagement";
import FacilityManagement from "./dashboard/FacilityManagement";
import DashboardHome from "./dashboard/DashboardHome";

export function DashboardAdmin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="dashboard-container">
      <div className={`dashboard-sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
        <div className="sidebar-header">
          <h2>Dashboard Admin</h2>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="" 
            className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <FaTachometerAlt className="me-2"/>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="users" 
            className={`nav-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
          >
            <FaUsers className="me-2"/>
            <span>Manajemen User</span>
          </Link>
          <Link 
            to="facilities" 
            className={`nav-item ${location.pathname === '/admin/facilities' ? 'active' : ''}`}
          >
            <FaBuilding className="me-2"/>
            <span>Manajemen Fasilitas</span>
          </Link>
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
          <Route index element={<DashboardHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="facilities" element={<FacilityManagement />} />
        </Routes>
      </main>
    </div>
  );
} 