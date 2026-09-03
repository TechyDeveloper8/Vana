import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('vanaentertainmentswork@gmail.com');
  const [password, setPassword] = useState('admin12@va');
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
    <div className="auth-container" style={{ borderTop: '4px solid var(--gold-primary)' }}>
      <h2>Admin Portal Login</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-body)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Restricted to Vana Entertainments Executive Staff
      </p>
      {error && (
        <div style={{ color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Admin Username / Email</label>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="vanaentertainmentswork@gmail.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin12@va" />
        </div>
        <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }} disabled={loading}>
          {loading ? 'Authenticating Admin...' : 'Enter Admin Panel'}
        </button>
      </form>
    </div>
  );
}
