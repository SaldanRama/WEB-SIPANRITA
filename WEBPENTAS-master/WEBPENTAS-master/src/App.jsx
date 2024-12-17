import { Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DetailFasilitas } from './pages/DetailFasilitas';
import { Login } from './pages/Login';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { NavbarComponents } from './components/NavbarComponents';
import NotificationComponents from './components/NotificationComponents';
import { PeminjamanPage } from './pages/PeminjamanPage';
import { DashboardDekan } from './pages/DashboardDekan';
import { DashboardWakilDekan } from './pages/DashboardWakilDekan';
import { FooterComponents } from './components/FooterComponents'
import { FasilitasPage } from './pages/FasilitasPage';
import { IzinKegiatan } from './pages/IzinKegiatan';
import { ContactPage } from './pages/ContactPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardWakilDekan1 } from './pages/DashboardWakilDekan1';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  return (
    <div>
      {/* Navbar */}
      {!isLoginPage && !isDashboardPage && <NavbarComponents />}

      <Routes>
        {/* Rute Publik */}
        <Route path="/izin-kegiatan" element={<IzinKegiatan />} />
        <Route path="/fasilitas" element={<FasilitasPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/detail-fasilitas/:id" element={<DetailFasilitas />} />
        <Route path="/login" Component={Login} />
        <Route path="/notifications" Component={NotificationComponents} />
        <Route path="/peminjaman" Component={PeminjamanPage} />

        {/* Rute Dilindungi */}

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-dekan/*"
          element={
            <ProtectedRoute allowedRoles={['dekan']}>
              <DashboardDekan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-wadek/*"
          element={
            <ProtectedRoute allowedRoles={['wakil_dekan']}>
              <DashboardWakilDekan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-wadek1/*"
          element={
            <ProtectedRoute allowedRoles={['wakil_dekan1']}>
              <DashboardWakilDekan1 />
            </ProtectedRoute>
          }
        />

        {/* Route untuk HomePage */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['mahasiswa', 'admin']}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        
      </Routes>

      {/* Footer */}
      {!isLoginPage && !isDashboardPage && <FooterComponents />}
    </div>
  );
}

export default App;
