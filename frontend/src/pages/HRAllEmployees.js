import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HRAllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get('/hr/all-employees');
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.user.emp_code?.toLowerCase().includes(searchLower) ||
      emp.personal?.fullName?.toLowerCase().includes(searchLower) ||
      emp.professional?.department?.toLowerCase().includes(searchLower) ||
      emp.professional?.jobTitle?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>All Employees</h1>
        <p>{employees.length} approved employee(s)</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <input
          type="text"
          placeholder="Search by name, emp code, department, or job title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
        />

        {filteredEmployees.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aab3bc' }}>
            No employees found.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Emp Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Date Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.user.id}>
                  <td>{employee.user.emp_code}</td>
                  <td>{employee.personal?.fullName || 'N/A'}</td>
                  <td>{employee.professional?.department || 'N/A'}</td>
                  <td>{employee.professional?.jobTitle || 'N/A'}</td>
                  <td>
                    {employee.professional?.dateJoined 
                      ? new Date(employee.professional.dateJoined).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/hr/employee/${employee.user.id}`)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HRAllEmployees;
