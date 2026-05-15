import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OtpInput from '../components/OtpInput';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'OTP sent to your registered personal email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      setMessage(res.data.message || 'Password reset successful. Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {step === 1 ? (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">
              Enter your company email. We will send a verification code to your registered personal email.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleRequestOtp}>
              <div className="form-group">
                <label htmlFor="forgot-email">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your work email"
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">Enter Verification Code</h1>
            <p className="auth-subtitle">
              Code sent for <strong>{email}</strong>. Enter all 6 digits, then set a new password.
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="otp-section">
                <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />
                <p className="otp-hint">
                  You will be redirected to login after your password is reset successfully.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>

            <p className="auth-footer" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
              >
                Use a different email
              </button>
            </p>
          </>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
