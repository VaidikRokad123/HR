import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) => `side-nav-link${isActive ? ' active' : ''}`;

  const employeesNavClass = ({ isActive }) => {
    const alsoDetail =
      location.pathname.startsWith('/hr/employee/') && location.pathname !== '/hr/all-employees';
    const on = isActive || alsoDetail;
    return `side-nav-link${on ? ' active' : ''}`;
  };

  const userInitials = () => {
    const e = user?.email || '';
    const local = e.split('@')[0] || 'U';
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return (local[0] || 'U').toUpperCase();
  };

  const roleLabel = () => {
    if (user?.role === 'hr') return 'HR Admin';
    if (user?.status === 'pending_hr') return 'Pending approval';
    return 'Employee';
  };

  const goTo = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  if (!user) {
    return null;
  }

  const dashboardPath = user.role === 'hr' ? '/hr/pending' : '/employee/dashboard';

  return (
    <>
      <aside className="side-nav" aria-label="Primary navigation">
        <Link to={dashboardPath} className="side-brand">
          <div className="side-brand-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
            </svg>
          </div>
          <div className="side-brand-text">
            <div className="side-brand-name">Saeculum</div>
            <div className="side-brand-guj">HRMS</div>
          </div>
        </Link>

        <nav className="side-nav-links" aria-label="Sections">
          {user.role === 'employee' && (
            <NavLink to="/employee/dashboard" className={navLinkClass} end title="Dashboard">
              <i className="ti ti-layout-dashboard" aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>
          )}

          {user.role === 'employee' && user.status === 'approved' && (
            <NavLink to="/employee/complete-profile" className={navLinkClass} title="Profile">
              <i className="ti ti-user-edit" aria-hidden="true" />
              <span>Profile</span>
            </NavLink>
          )}

          {user.role === 'hr' && (
            <>
              <NavLink to="/hr/pending" className={navLinkClass} title="Pending">
                <i className="ti ti-clock-hour-4" aria-hidden="true" />
                <span>Pending</span>
              </NavLink>
              <NavLink to="/hr/all-employees" className={employeesNavClass} title="Employees">
                <i className="ti ti-users" aria-hidden="true" />
                <span>Employees</span>
              </NavLink>
              <NavLink to="/hr/upcoming-events" className={navLinkClass} title="Events">
                <i className="ti ti-calendar-event" aria-hidden="true" />
                <span>Events</span>
              </NavLink>
              <NavLink to="/hr/documents" className={navLinkClass} title="Documents">
                <i className="ti ti-file-text" aria-hidden="true" />
                <span>Docs</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <header className="app-topbar">
        <div className="app-topbar-title">
          <span className="app-topbar-mark">HR</span>
          <span className="app-topbar-name">Saeculum</span>
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

          <div className="navbar-dropdown user-menu-wrap" ref={userMenuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setShowUserMenu((open) => !open)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <span className="up-avatar">{userInitials()}</span>
              <span className="user-menu-email">{user.email}</span>
              <i className={`ti ti-chevron-${showUserMenu ? 'up' : 'down'} user-menu-chevron`} aria-hidden="true" />
            </button>

            {showUserMenu && (
              <div className="dropdown-menu user-menu-dropdown">
                <div className="user-menu-header">
                  {user.emp_code && <span className="user-menu-header-meta">{user.emp_code}</span>}
                  <span className="user-menu-role">{roleLabel()}</span>
                </div>

                <div className="user-menu-divider" />

                <button type="button" className="user-menu-item user-menu-item--logout" onClick={handleLogout}>
                  <i className="ti ti-logout" aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
