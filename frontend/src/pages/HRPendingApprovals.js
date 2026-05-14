import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HRPendingApprovals = () => {
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingEmployees();
  }, []);

  const fetchPendingEmployees = async () => {
    try {
      const response = await axios.get('/hr/pending-employees');
      setPendingEmployees(response.data);
    } catch (err) {
      setError('Failed to load pending employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Pending Approvals</h1>
        <p>{pendingEmployees.length} employee(s) waiting for approval</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {pendingEmployees.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#aab3bc' }}>
            No pending approvals at the moment.
          </p>
        </div>
      ) : (
        pendingEmployees.map((employee) => (
          <div 
            key={employee.user.id} 
            className="employee-card"
            onClick={() => navigate(`/hr/employee/${employee.user.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{employee.personal?.fullName || 'N/A'}</h3>
                <p style={{ color: '#aab3bc', marginTop: '8px' }}>
                  <strong>Email:</strong> {employee.user.email}
                </p>
                <p style={{ color: '#aab3bc' }}>
                  <strong>Mobile:</strong> {employee.personal?.mobile || 'N/A'}
                </p>
                <p style={{ color: '#aab3bc' }}>
                  <strong>Submitted:</strong> {new Date(employee.user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="badge badge-pending">Pending</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default HRPendingApprovals;
