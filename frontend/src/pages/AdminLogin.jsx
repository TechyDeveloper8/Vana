import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin@vana.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-container" style={{ borderTop: '4px solid #ff3b00' }}>
      <h2>Admin Portal Login</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
        Restricted to Vana Entertainments staff
      </p>
      {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div class="form-group">
          <label>Admin Username / Email</label>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin@vana.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" />
        </div>
        <button type="submit" class="secondary-btn" style={{ width: '100%', background: '#0f172a' }} disabled={loading}>
          {loading ? 'Authenticating Admin...' : 'Enter Admin Panel'}
        </button>
      </form>
    </div>
  );
}
