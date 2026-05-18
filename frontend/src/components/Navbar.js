import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  const [showNotificationsDropdown, setShowNotificationsDropdown] =
    useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      fetchUnreadCount();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationsOpen = () => {
    setShowNotificationsDropdown(true);
    fetchNotifications();
  };

  const navLinkClass = ({ isActive }) =>
    `side-nav-link${isActive ? " active" : ""}`;

  const employeesNavClass = ({ isActive }) => {
    const alsoDetail =
      location.pathname.startsWith("/employees/") &&
      location.pathname !== "/employees";
    const on = isActive || alsoDetail;
    return `side-nav-link${on ? " active" : ""}`;
  };

  return (
    <>
      <aside className="side-nav" aria-label="Primary navigation">
        <Link to="/employees" className="side-brand">
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
          <NavLink
            to="/employees"
            className={employeesNavClass}
            title="Employees"
          >
            <i className="ti ti-users" aria-hidden="true" />
            <span>Employees</span>
          </NavLink>
          <NavLink to="/events" className={navLinkClass} title="Events">
            <i className="ti ti-calendar-event" aria-hidden="true" />
            <span>Events</span>
          </NavLink>
          <NavLink to="/documents" className={navLinkClass} title="Documents">
            <i className="ti ti-file-text" aria-hidden="true" />
            <span>Docs</span>
          </NavLink>
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
            <button
              type="button"
              className="nav-icon-btn"
              aria-label="Notifications"
            >
              <i className="ti ti-bell" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="notif-dot" aria-hidden="true" />
              )}
            </button>
            {showNotificationsDropdown && (
              <div className="dropdown-menu notifications-dropdown">
                {notifications.length === 0 ? (
                  <div className="dropdown-item notif-empty">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification._id}
                      className={`dropdown-item notification-item ${!notification.isRead ? "unread" : ""}`}
                      onClick={() => handleNotificationClick(notification._id)}
                      role="presentation"
                    >
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
