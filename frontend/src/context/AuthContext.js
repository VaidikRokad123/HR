import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Set axios defaults
  axios.defaults.baseURL = API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      const userData = response.data;
      
      // Check if profile is complete by calling waiting-status endpoint
      if (userData.status === 'approved' && userData.role === 'employee') {
        try {
          const statusResponse = await axios.get('/employee/waiting-status');
          userData.profileComplete = statusResponse.data.profileComplete;
        } catch (error) {
      console.error("❌ Caught Error:", error);
          userData.profileComplete = false;
        }
      } else if (userData.role === 'hr') {
        // HR users always have complete profiles
        userData.profileComplete = true;
      } else {
        userData.profileComplete = false;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Fetch user error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Check profile completion status
    if (userData.status === 'approved' && userData.role === 'employee') {
      try {
        const statusResponse = await axios.get('/employee/waiting-status');
        userData.profileComplete = statusResponse.data.profileComplete;
      } catch (error) {
      console.error("❌ Caught Error:", error);
        userData.profileComplete = false;
      }
    } else if (userData.role === 'hr') {
      // HR users always have complete profiles
      userData.profileComplete = true;
    } else {
      userData.profileComplete = false;
    }
    
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const register = async (data) => {
    const response = await axios.post('/auth/register', data);
    const { token, user } = response.data;

    if (token && user) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    }

    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
