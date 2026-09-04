import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchAPI('/staff/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!data.success) {
        throw new Error(data.message || 'Staff login failed');
      }

      // Save Auth Token & User object
      login(data.user, data.token);
      navigate('/staff/portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#FFFFFF'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#141824',
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-hover)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              background: 'var(--gold-gradient)',
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              color: '#0A0D14',
              boxShadow: '0 10px 25px rgba(212, 175, 55, 0.35)',
              marginBottom: '14px'
            }}
          >
            <i className="fa-solid fa-qrcode"></i>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-heading)' }}>
            Gate Passer Portal
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>
            Ticket QR Validation & Seat Number Verification
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>Staff Email / Username</label>
            <input
              type="email"
              required
              placeholder="staff@vanaentertainments.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#0B0E17',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>Staff Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#0B0E17',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-btn"
            style={{
              width: '100%',
              padding: '14px',
              justifyContent: 'center',
              borderRadius: '10px',
              fontSize: '1rem',
              marginTop: '6px'
            }}
          >
            {loading ? (
              <span>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '6px' }}></i> Authenticating...
              </span>
            ) : (
              'Log In to Gate Portal'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)' }}>
          <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px', color: 'var(--gold-accent)' }}></i> Restricted Staff Gate Scanner | Vana Ticketing
        </div>
      </div>
    </div>
  );
}
