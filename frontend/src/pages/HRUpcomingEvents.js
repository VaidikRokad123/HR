import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SECTIONS = [
  { key: 'birthdays', label: 'Upcoming Birthdays' },
  { key: 'anniversaries', label: 'Work Anniversaries' },
  { key: 'probation', label: 'Probation Ending' },
  { key: 'incompleteProfiles', label: 'Incomplete Profiles' },
  { key: 'payrollPending', label: 'Payroll Pending' },
];

const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const HRUpcomingEvents = () => {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/hr/upcoming-events');
      setEvents(res.data);
    } catch (err) {
      setError('Failed to load upcoming events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTriggerReminders = async () => {
    setTriggering(true);
    setTriggerMsg('');
    try {
      await axios.post('/hr/trigger-reminders');
      setTriggerMsg('Reminders triggered. Emails sent to HR inbox.');
    } catch {
      setTriggerMsg('Failed to trigger reminders. Check if RabbitMQ is running.');
    } finally {
      setTriggering(false);
    }
  };

  const totalAlerts = events
    ? Object.values(events).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    : 0;

  const renderDetail = (key, item) => {
    switch (key) {
      case 'birthdays':
        return `Birthday ${fmt(item.dob)} · in ${item.daysLeft} days`;
      case 'anniversaries':
        return `${item.yearsCompleted} yr(s) on ${fmt(item.dateJoined)} · in ${item.daysLeft} days`;
      case 'probation':
        return `Ends ${fmt(item.probationEndDate)} · ${item.daysLeft} day(s) left`;
      case 'incompleteProfiles':
        return `Approved ${item.daysSinceApproval} days ago · bank/LinkedIn missing`;
      case 'payrollPending':
        return `Joined ${fmt(item.dateJoined)} · ${item.daysSinceJoining} days ago`;
      default:
        return '';
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Upcoming Events</h1>
            <p>
              Next 7 days · {loading ? '...' : `${totalAlerts} alert(s)`}
            </p>
          </div>
          <div className="page-actions">
            <button type="button" className="btn btn-secondary" onClick={fetchEvents} disabled={loading}>
              Refresh
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTriggerReminders}
              disabled={triggering}
              title="Send email + in-app notifications for all upcoming events now"
            >
              {triggering ? 'Sending...' : 'Send reminders'}
            </button>
          </div>
        </div>
        {triggerMsg && (
          <div className={`alert ${triggerMsg.startsWith('Reminders') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 10 }}>
            {triggerMsg}
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading upcoming events...</div>
      ) : (
        <div className="events-grid">
          {SECTIONS.map(({ key, label }) => {
            const items = events?.[key] || [];
            return (
              <div key={key} className="event-card">
                <div className="event-card-header">
                  <span className="event-card-title">{label}</span>
                  <span className="event-card-count">{items.length}</span>
                </div>
                <div className="event-card-body">
                  {items.length === 0 ? (
                    <div className="empty-state">Nothing upcoming</div>
                  ) : (
                    items.map((item, i) => (
                      <div key={i} className="event-item">
                        <div>
                          <div className="event-item-name">
                            {item.fullName || item.email || item.emp_code}
                          </div>
                          <div className="event-item-meta">
                            {item.emp_code}
                            {item.department ? ` · ${item.department}` : ''}
                            {item.jobTitle ? ` · ${item.jobTitle}` : ''}
                          </div>
                          <div className="event-item-detail">{renderDetail(key, item)}</div>
                        </div>
                        {(key === 'incompleteProfiles' || key === 'payrollPending') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate('/hr/all-employees')}
                          >
                            View
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HRUpcomingEvents;
