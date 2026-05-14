import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showHRDropdown, setShowHRDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleNotificationsOpen = () => {
    setShowNotificationsDropdown(true);
    fetchNotifications();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDropdownItemClick = (path) => {
    // Close all dropdowns
    setShowEmployeeDropdown(false);
    setShowHRDropdown(false);
    setShowNotificationsDropdown(false);
    // Navigate to the path
    navigate(path);
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          HR Management Portal
        </Link>

        <div className="navbar-menu">
          {user.role === 'employee' && (
            <div
              className="navbar-dropdown"
              onMouseEnter={() => setShowEmployeeDropdown(true)}
              onMouseLeave={() => setShowEmployeeDropdown(false)}
            >
              <button className="navbar-link">
                Employee ▾
              </button>
              {showEmployeeDropdown && (
                <div className="dropdown-menu">
                  <div 
                    className="dropdown-item"
                    onClick={() => handleDropdownItemClick('/employee/dashboard')}
                  >
                    📊 Dashboard
                  </div>
                  <div 
                    className="dropdown-item"
                    onClick={() => handleDropdownItemClick('/employee/dashboard')}
                  >
                    👤 My Profile
                  </div>
                  {user.status === 'approved' && (
                    <div 
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('/employee/complete-profile')}
                    >
                      ✏️ Complete Profile
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user.role === 'hr' && (
            <>
              <div
                className="navbar-dropdown"
                onMouseEnter={() => setShowEmployeeDropdown(true)}
                onMouseLeave={() => setShowEmployeeDropdown(false)}
              >
                <button className="navbar-link">
                  My Profile ▾
                </button>
                {showEmployeeDropdown && (
                  <div className="dropdown-menu">
                    <div 
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('/employee/dashboard')}
                    >
                      📊 Dashboard
                    </div>
                    <div 
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('/employee/dashboard')}
                    >
                      👤 My Profile
                    </div>
                  </div>
                )}
              </div>
              
              <div
                className="navbar-dropdown"
                onMouseEnter={() => setShowHRDropdown(true)}
                onMouseLeave={() => setShowHRDropdown(false)}
              >
                <button className="navbar-link">
                  HR Management ▾
                </button>
                {showHRDropdown && (
                  <div className="dropdown-menu">
                    <div 
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('/hr/pending')}
                    >
                      ⏳ Pending Approvals
                    </div>
                    <div 
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('/hr/all-employees')}
                    >
                      👥 All Employees
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notifications Dropdown */}
          <div
            className="navbar-dropdown"
            onMouseEnter={handleNotificationsOpen}
            onMouseLeave={() => setShowNotificationsDropdown(false)}
          >
            <button className="navbar-link notification-button">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {showNotificationsDropdown && (
              <div className="dropdown-menu notifications-dropdown">
                {notifications.length === 0 ? (
                  <div className="dropdown-item" style={{ color: '#98a4ae', cursor: 'default' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification._id}
                      className={`dropdown-item notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification._id)}
                    >
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="navbar-user">
            <span className="user-email">{user.email}</span>
            {user.emp_code && (
              <span className="user-code">({user.emp_code})</span>
            )}
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
