import { useState } from 'react';
import '../disc/css/main.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email tidak valid');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      const { role } = response.data;

      // Simpan data di localStorage
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('isLoggedIn', 'true');

      // Reset form
      setEmail('');
      setPassword('');

      // Tampilkan alert sukses
      alert('Login berhasil!');

      // Redirect berdasarkan role
      switch (role) {
        case 'admin':
          navigate('/dashboard');
          break;
        case 'dekan':
          navigate('/dashboard-dekan');
          break;
        case 'wakil_dekan':
          navigate('/dashboard-wadek');
          break;
        case 'wakil_dekan1':
          navigate('/dashboard-wadek1');
          break;
        default:
          navigate('/');
      }       
    } catch (err) {
      // Tampilkan error
      const message = err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(message);
      alert(`Login gagal: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1 className="fw-bold">WELCOME TO SIPANRITA</h1>
        <p>SISTEM PENGELOLAAN REKOMENDASI KEGIATAN DAN PEMINJAMAN FASILITAS</p>
      </div>

      <div className="login-right">
        <div className="login-form">
          <h2 className="fw-bold">LOGIN</h2>
          <p>Masukkan data dengan lengkap</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-input-container" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? "🙉" : "🙈"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="forgot-password">
              <a href="#">Forgot Password</a>
            </div>

            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};