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

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.status === 'pending_hr') {
        navigate('/waiting', { replace: true });
      } else if (loggedInUser.status === 'approved' && !loggedInUser.profileComplete) {
        navigate('/employee/complete-profile', { replace: true });
      } else {
        navigate(loggedInUser.role === 'hr' ? '/hr/pending' : '/employee/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Enter your credentials to access your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-footer-row">
            <span>
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </span>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
