import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    
    console.log('🔐 Forgot Password - Requesting OTP');
    console.log('📧 Email:', email);
    console.log('🌐 API URL:', process.env.REACT_APP_API_URL);
    
    try {
      // Remove duplicate /api since REACT_APP_API_URL already includes it
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/forgot-password`;
      console.log('📤 Sending request to:', apiUrl);
      
      const res = await axios.post(apiUrl, { email });
      
      console.log('✅ Response received:', res.data);
      setMessage(res.data.message || 'OTP sent successfully.');
      setStep(2);
    } catch (err) {
      console.error('═══════════════════════════════════════════════════');
      console.error('❌ FORGOT PASSWORD ERROR');
      console.error('═══════════════════════════════════════════════════');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('Error config:', err.config);
      console.error('═══════════════════════════════════════════════════');
      
      setError(err.response?.data?.message || 'Failed to send OTP. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    console.log('🔄 Reset Password - Submitting OTP');
    console.log('📧 Email:', email);
    console.log('🔢 OTP:', otp);
    
    try {
      // Remove duplicate /api since REACT_APP_API_URL already includes it
      const apiUrl = `${process.env.REACT_APP_API_URL}/auth/reset-password`;
      console.log('📤 Sending request to:', apiUrl);
      
      const res = await axios.post(apiUrl, { 
        email, 
        otp, 
        newPassword 
      });
      
      console.log('✅ Password reset successful:', res.data);
      setMessage(res.data.message || 'Password reset successful.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('═══════════════════════════════════════════════════');
      console.error('❌ RESET PASSWORD ERROR');
      console.error('═══════════════════════════════════════════════════');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('═══════════════════════════════════════════════════');
      
      setError(err.response?.data?.message || 'Failed to reset password. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <p style={{ marginBottom: '20px', color: '#555', fontSize: '14px' }}>
              Enter your company email address. We will send an OTP to your registered personal email.
            </p>
            <div className="form-group">
              <label>Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your work email"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p style={{ marginBottom: '20px', color: '#555', fontSize: '14px' }}>
              Enter the 6-digit OTP sent to your personal email and your new password.
            </p>
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '18px' }}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
                placeholder="Enter new password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
