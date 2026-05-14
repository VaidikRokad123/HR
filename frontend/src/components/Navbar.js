import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.css';

/** Sidi Saiyyed–style jaali decoration (simplified from saeculum_hrms_topnav_jaali.html) */
function NavJaaliSvg() {
  return (
    <svg
      className="nav-jaali-svg"
      viewBox="0 0 340 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M340 95 L280 95 L280 45 Q310 5 340 0 Z" fill="#E8650A" opacity="0.04" />
      <path
        d="M200 95 Q200 10 270 5 Q330 0 340 40 L340 95"
        stroke="#E8650A"
        strokeWidth="1"
        fill="none"
        opacity="0.15"
      />
      <path
        d="M215 95 Q215 18 272 13 Q322 8 332 42 L332 95"
        stroke="#E8650A"
        strokeWidth="0.6"
        fill="none"
        opacity="0.1"
      />
      <line x1="280" y1="95" x2="280" y2="42" stroke="#F5A05A" strokeWidth="1.8" opacity="0.55" />
      <path d="M280 78 Q255 65 238 48" stroke="#F5A05A" strokeWidth="1.3" fill="none" opacity="0.5" />
      <path d="M280 70 Q260 55 248 35" stroke="#F5A05A" strokeWidth="1.1" fill="none" opacity="0.45" />
      <path d="M280 78 Q305 65 322 48" stroke="#F5A05A" strokeWidth="1.3" fill="none" opacity="0.5" />
      <path d="M280 70 Q300 55 312 35" stroke="#F5A05A" strokeWidth="1.1" fill="none" opacity="0.45" />
      <circle cx="252" cy="68" r="12" stroke="#E8650A" strokeWidth="0.7" fill="none" opacity="0.2" />
      <circle cx="308" cy="68" r="12" stroke="#E8650A" strokeWidth="0.7" fill="none" opacity="0.2" />
      <circle cx="280" cy="14" r="3" fill="#E8650A" opacity="0.45" />
    </svg>
  );
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
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

  const navLinkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const employeesNavClass = ({ isActive }) => {
    const alsoDetail =
      location.pathname.startsWith('/hr/employee/') && location.pathname !== '/hr/all-employees';
    const on = isActive || alsoDetail;
    return `nav-link${on ? ' active' : ''}`;
  };

  const userInitials = () => {
    const e = user?.email || '';
    const local = e.split('@')[0] || 'U';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return (local[0] || 'U').toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <header className="topnav-shell">
      <nav className="topnav" aria-label="Main">
        <div className="rangoli-strip" aria-hidden="true" />
        <div className="jaali-wrap">
          <NavJaaliSvg />
        </div>

        <div className="nav-row">
          <Link to="/employee/dashboard" className="brand">
            <div className="brand-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
              </svg>
            </div>
            <div className="brand-text">
              <div className="brand-name">Saeculum</div>
              <div className="brand-guj">HRMS</div>
            </div>
          </Link>

          <div className="nav-links">
            <NavLink to="/employee/dashboard" className={navLinkClass} end>
              <i className="ti ti-layout-dashboard" aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>

            {user.role === 'employee' && user.status === 'approved' && (
              <NavLink to="/employee/complete-profile" className={navLinkClass}>
                <i className="ti ti-user-edit" aria-hidden="true" />
                <span>Complete profile</span>
              </NavLink>
            )}

            {user.role === 'hr' && (
              <>
                <NavLink to="/hr/pending" className={navLinkClass}>
                  <i className="ti ti-clock-hour-4" aria-hidden="true" />
                  <span>Pending</span>
                </NavLink>
                <NavLink to="/hr/all-employees" className={employeesNavClass}>
                  <i className="ti ti-users" aria-hidden="true" />
                  <span>Employees</span>
                </NavLink>
              </>
            )}
          </div>

          <div className="nav-right">
            <div
              className="navbar-dropdown nav-notif-wrap"
              onMouseEnter={handleNotificationsOpen}
              onMouseLeave={() => setShowNotificationsDropdown(false)}
            >
              <button type="button" className="nav-icon-btn" aria-label="Notifications">
                <i className="ti ti-bell" aria-hidden="true" />
                {unreadCount > 0 && <span className="notif-dot" aria-hidden="true" />}
              </button>
              {showNotificationsDropdown && (
                <div className="dropdown-menu notifications-dropdown">
                  {notifications.length === 0 ? (
                    <div className="dropdown-item notif-empty">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification._id}
                        className={`dropdown-item notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification._id)}
                        role="presentation"
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

            <div className="user-pill" title={user.email}>
              <div className="up-avatar">{userInitials()}</div>
              <div className="up-meta">
                <span className="up-name">{user.email}</span>
                {user.emp_code && <span className="up-code">{user.emp_code}</span>}
              </div>
            </div>

            <button type="button" className="btn-nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
