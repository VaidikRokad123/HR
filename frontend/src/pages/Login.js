import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      if (user.status === 'pending_hr') {
        navigate('/waiting', { replace: true });
      } else if (user.status === 'approved' && !user.profileComplete) {
        navigate('/employee/complete-profile', { replace: true });
      } else {
        navigate(user.role === 'hr' ? '/hr/pending' : '/employee/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔐 Login attempt');
    console.log('📧 Email:', email);

    try {
      const user = await login(email, password);
      
      console.log('✅ Login successful');
      console.log('👤 User:', user);
      
      // STRICT WORKFLOW: Redirect based on user status
      if (user.status === 'pending_hr') {
        // Pending users go to waiting page ONLY
        console.log('➡️ Redirecting to waiting page');
        navigate('/waiting', { replace: true });
      } else if (user.status === 'approved' && !user.profileComplete) {
        // Approved but incomplete profile - go to complete profile ONLY
        console.log('➡️ Redirecting to complete profile');
        navigate('/employee/complete-profile', { replace: true });
      } else {
        // Fully completed users go to dashboard
        console.log('➡️ Redirecting to dashboard');
        navigate(user.role === 'hr' ? '/hr/pending' : '/employee/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('═══════════════════════════════════════════════════');
      console.error('❌ LOGIN ERROR');
      console.error('═══════════════════════════════════════════════════');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      console.error('═══════════════════════════════════════════════════');
      
      setError(err.response?.data?.message || 'Login failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
          <p style={{ margin: 0 }}>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/forgot-password" style={{ color: 'var(--saffron)' }}>Forgot Password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
