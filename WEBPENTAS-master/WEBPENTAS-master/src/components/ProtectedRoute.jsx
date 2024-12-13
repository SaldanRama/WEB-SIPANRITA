import { Navigate, useLocation } from 'react-router-dom';

// Komponen ProtectedRoute
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const location = useLocation();
  
    // Redirect mapping untuk role
    const redirectPaths = {
      admin: '/dashboard',
      dekan: '/dashboard-dekan',
      wakil_dekan: '/dashboard-wadek',
    };
  
    // Cek apakah pengguna belum login
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
  
    // Validasi akses ke halaman home (/)
    if (location.pathname === '/' && !['mahasiswa', 'admin'].includes(role)) {
      alert('Halaman ini hanya dapat diakses oleh mahasiswa dan admin!');
      return <Navigate to={redirectPaths[role] || '/login'} replace />;
    }
  
    // Validasi role untuk halaman lain
    if (!allowedRoles.includes(role)) {
      if (location.pathname !== '/') {
        alert('Anda tidak memiliki akses ke halaman ini!');
      }
      return <Navigate to={redirectPaths[role] || '/'} replace />;
    }
  
    // Render komponen anak jika semua validasi lolos
    return children;
  };
  
