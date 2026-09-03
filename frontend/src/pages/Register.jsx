import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Fill details, 2: Enter OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, sendSignupOTP } = useAuth();
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await sendSignupOTP(email);
      setSuccessMsg(res.message || `Verification code dispatched to ${email}`);
      setStep(2);
      startCooldown();
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await sendSignupOTP(email);
      setSuccessMsg(res.message || `New OTP code dispatched to ${email}`);
      startCooldown();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.length < 4) {
      setError('Please enter the valid OTP code received on your email');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, phone, password, otp);
      navigate(redirectTarget);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{step === 1 ? 'Create Vana Account' : 'Verify Email OTP'}</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-body)', fontSize: '0.9rem', marginBottom: '24px' }}>
        {step === 1
          ? 'Register to manage bookings & receive VIP event invitations'
          : `We sent a 6-digit verification code to ${email}`}
      </p>

      {error && (
        <div style={{ color: '#F87171', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ color: '#4ADE80', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', textAlign: 'center', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOTP}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Full Name" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }} disabled={loading}>
            {loading ? 'Sending Verification Code...' : 'Get Email OTP Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister}>
          <div className="form-group">
            <label>6-Digit Verification Code</label>
            <input
              type="text"
              required
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 583920"
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 'bold', color: 'var(--gold-accent)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Edit Account Details
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              style={{ background: 'none', border: 'none', color: resendCooldown > 0 ? '#64748B' : 'var(--gold-accent)', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>

          <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '10px' }} disabled={loading}>
            {loading ? 'Verifying & Creating Profile...' : 'Verify OTP & Complete Registration'}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-body)' }}>
        Already registered?{' '}
        <Link to={`/login${location.search}`} style={{ color: 'var(--gold-accent)', fontWeight: 600 }}>
          Sign In Here
        </Link>
      </p>
    </div>
  );
}
