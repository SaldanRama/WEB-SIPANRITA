import { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // pastikan Bootstrap diimpor
import '/src/disc/css/main.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '' 
  });
  const [toastMessage, setToastMessage] = useState(null);  // State untuk pesan toast

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setError('Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Add user
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/users', {
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      
      setShowModal(false);
      setFormData({ email: '', password: '', role: '' });
      fetchUsers();
      setToastMessage('Pengguna berhasil ditambahkan!');  // Show success message

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 'Gagal menambah pengguna');
    }
  };

  // Edit user
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/users/${editingUser.id}`, formData);
      setShowModal(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: '' });
      fetchUsers();
      setToastMessage('Pengguna berhasil diperbarui!');  // Show success message

      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (error) {
      console.error(error);
      setError('Gagal mengupdate pengguna');
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await axios.delete(`http://localhost:5000/users/${id}`);
        fetchUsers();
        setToastMessage('Pengguna berhasil dihapus!');  // Show success message

        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setToastMessage(null);
        }, 5000);
      } catch (error) {
        console.error(error);
        setError('Gagal menghapus pengguna');
      }
    }
  };

  // Open modal for edit
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      password: '' // kosongkan password saat edit
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="management-card">
      <div className="card-header">
        <h2>Kelola Pengguna</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Tambah Pengguna
        </button>
      </div>

      {/* Modal Form */}
      <div className={`custom-modal ${showModal ? 'show' : ''}`}>
        <div className="custom-modal-dialog">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h5 className="custom-modal-title">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', role: '' });
                }}
              />
            </div>
            <form onSubmit={editingUser ? handleEdit : handleAdd}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  name="role" 
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className='form-select'
                  aria-label="Floating label select example"
                >
                  <option selected>Role</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="admin">Admin</option>
                  <option value="dekan">Dekan</option>
                  <option value="wakil_dekan">Wakil Dekan</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', role: '' });
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      {users.length > 0 ? (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td>
                    <span className="text-dark">
                      {user.role}
                    </span>
                  </td>
                  <td className="form-actions my-auto">
                    <button 
                      className="btn btn-warning"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDelete(user.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">Tidak ada data pengguna</div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <strong className="me-auto">Notifikasi</strong>
              <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div className="toast-body">
              {toastMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
