import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const FIXED_ADMIN_EMAIL = 'vanaentertainmentswork@gmail.com';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(FIXED_ADMIN_EMAIL, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ borderTop: '4px solid var(--gold-primary)' }}>
      <h2>Admin Portal Login</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-body)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Restricted to Vana Entertainments Executive Administrator
      </p>
      {error && (
        <div style={{ color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ marginBottom: 0 }}>Fixed Administrator Email</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-lock" style={{ fontSize: '0.7rem' }}></i> Master Admin
            </span>
          </div>
          <input
            type="email"
            readOnly
            value={FIXED_ADMIN_EMAIL}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-heading)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              cursor: 'not-allowed',
              fontWeight: 600
            }}
          />
        </div>
        <div className="form-group">
          <label>Admin Password</label>
          <input
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
          />
        </div>
        <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }} disabled={loading}>
          {loading ? 'Authenticating Admin...' : 'Enter Admin Panel'}
        </button>
      </form>
    </div>
  );
}
