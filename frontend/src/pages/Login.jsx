import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot_email' | 'forgot_reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, isLoginHidden, sendForgotOTP, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect') || '/dashboard';

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(email, password);
      const userRole = res.user?.role || 'user';

      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'staff') {
        navigate('/staff/portal');
      } else {
        navigate(redirectTarget);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await sendForgotOTP(email);
      setSuccessMsg(res.message || `Password reset code sent to ${email}`);
      setMode('forgot_reset');
      startCooldown();
    } catch (err) {
      setError(err.message || 'Could not send reset OTP. Please verify email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await sendForgotOTP(email);
      setSuccessMsg(res.message || `New password reset code sent to ${email}`);
      startCooldown();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || !newPassword) {
      setError('Please enter both the OTP code and your new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, otp, newPassword);
      setSuccessMsg(res.message || 'Password reset successfully! Logging you in...');
      
      setTimeout(async () => {
        try {
          const loginRes = await login(email, newPassword);
          const userRole = loginRes.user?.role || 'user';
          if (userRole === 'admin') navigate('/admin/dashboard');
          else if (userRole === 'staff') navigate('/staff/portal');
          else navigate(redirectTarget);
        } catch (e) {
          setMode('login');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>
        {mode === 'login' && 'Account Sign In'}
        {mode === 'forgot_email' && 'Reset Password'}
        {mode === 'forgot_reset' && 'Verify OTP & Set New Password'}
      </h2>
      
      <p style={{ textAlign: 'center', color: '#5F5F5F', fontSize: '0.9rem', marginBottom: '24px' }}>
        {mode === 'login' && 'Single portal for Customer Bookings, Event Staff Verification & Admin Access'}
        {mode === 'forgot_email' && 'Enter your registered email address to receive a 6-digit recovery OTP'}
        {mode === 'forgot_reset' && `We sent a 6-digit verification OTP code to ${email}`}
      </p>

      {isLoginHidden && mode === 'login' && (
        <div
          style={{
            background: '#fffbe5',
            border: '1px solid #ffe58f',
            color: '#8c6b00',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          <i className="fa-solid fa-eye-slash" style={{ marginRight: '8px' }}></i>
          Notice: The public Login button in the header is currently hidden. Administrative & Staff login remains functional below.
        </div>
      )}

      {error && (
        <div
          style={{
            color: '#b91c1c',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            textAlign: 'center',
            fontWeight: 600
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            color: '#15803d',
            background: '#dcfce7',
            border: '1px solid #86efac',
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            textAlign: 'center',
            fontWeight: 600
          }}
        >
          {successMsg}
        </div>
      )}
      
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label>Email Address / Username</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@gmail.com or staff@vana.com"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { setError(''); setSuccessMsg(''); setMode('forgot_email'); }}
                style={{ background: 'none', border: 'none', color: '#B8860B', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating Role...' : 'Sign In To Dashboard'}
          </button>
        </form>
      )}

      {mode === 'forgot_email' && (
        <form onSubmit={handleSendForgotOTP}>
          <div className="form-group">
            <label>Registered Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px', marginBottom: '12px' }}
            disabled={loading}
          >
            {loading ? 'Sending OTP Code...' : 'Send Password Reset OTP'}
          </button>

          <button
            type="button"
            onClick={() => { setError(''); setSuccessMsg(''); setMode('login'); }}
            style={{ width: '100%', background: '#F6EFE5', border: '1px solid #E7DDD1', color: '#1F1F1F', padding: '12px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back to Sign In
          </button>
        </form>
      )}

      {mode === 'forgot_reset' && (
        <form onSubmit={handleResetPasswordSubmit}>
          <div className="form-group">
            <label>6-Digit Verification Code</label>
            <input
              type="text"
              required
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 849201"
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 'bold', color: '#B8860B' }}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              required
              minLength="6"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setMode('forgot_email')}
              style={{ background: 'none', border: 'none', color: '#5F5F5F', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Edit Email Address
            </button>

            <button
              type="button"
              onClick={handleResendForgotOTP}
              disabled={resendCooldown > 0 || loading}
              style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#9ca3af' : '#B8860B', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>

          <button
            type="submit"
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
          </button>
        </form>
      )}

      {mode === 'login' && (
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#5F5F5F' }}>
          Don't have an account?{' '}
          <Link to={`/register${location.search}`} style={{ color: '#B8860B', fontWeight: 600 }}>
            Create Customer Account
          </Link>
        </p>
      )}

      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
        <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i>
        Secure OTP Verification via Gmail SMTP
      </div>
    </div>
  );
}
