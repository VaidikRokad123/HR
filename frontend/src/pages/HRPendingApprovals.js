import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const HRPendingApprovals = () => {
  const location = useLocation();
  const initialTab = location.state?.activeTab === 'payrolls' ? 'payrolls' : 'profiles';
  const [activeTab, setActiveTab] = useState(initialTab); // 'profiles' or 'payrolls'
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [pendingPayrolls, setPendingPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Modal state for payroll
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    ctc: '',
    gross: '',
    pf: false,
    pt: false,
    esic: false,
    tds: false
  });
  const [payrollSubmitting, setPayrollSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'profiles') {
      fetchPendingEmployees();
    } else {
      fetchPendingPayrolls();
    }
  }, [activeTab]);

  const fetchPendingEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/hr/pending-employees');
      setPendingEmployees(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load pending employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayrolls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/hr/pending-payrolls');
      setPendingPayrolls(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load pending payrolls');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayrollModal = (emp) => {
    setSelectedEmpForPayroll(emp);
    setPayrollForm({
      ctc: '',
      gross: '',
      pf: false,
      pt: false,
      esic: false,
      tds: false
    });
    setShowPayrollModal(true);
  };

  const handlePayrollChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPayrollForm({
      ...payrollForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePayrollSubmit = async (e) => {
    e.preventDefault();
    setPayrollSubmitting(true);
    try {
      await axios.post(`/hr/payroll/${selectedEmpForPayroll.user.id}`, {
        ctc: Number(payrollForm.ctc),
        gross: Number(payrollForm.gross),
        pf: payrollForm.pf,
        pt: payrollForm.pt,
        esic: payrollForm.esic,
        tds: payrollForm.tds
      });
      setShowPayrollModal(false);
      fetchPendingPayrolls(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit payroll details');
    } finally {
      setPayrollSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Pending Approvals</h1>
          <p>Manage pending employee profiles and payroll details</p>
        </div>
      </div>

      <div className="hr-pending-tabs">
        <button
          type="button"
          className={`hr-pending-tab${activeTab === 'profiles' ? ' hr-pending-tab--active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profiles ({activeTab === 'profiles' ? pendingEmployees.length : '…'})
        </button>
        <button
          type="button"
          className={`hr-pending-tab${activeTab === 'payrolls' ? ' hr-pending-tab--active' : ''}`}
          onClick={() => setActiveTab('payrolls')}
        >
          Payrolls ({activeTab === 'payrolls' ? pendingPayrolls.length : '…'})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : activeTab === 'profiles' ? (
        // Profile Approvals Tab
        pendingEmployees.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#000000' }}>
              No pending profiles at the moment.
            </p>
          </div>
        ) : (
          pendingEmployees.map((employee) => (
            <div 
              key={employee.user.id} 
              className="card employee-card"
              onClick={() => navigate(`/hr/employee/${employee.user.id}`)}
              style={{ cursor: 'pointer', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
            >
              <div>
                <h3>{employee.personal?.fullName || 'N/A'}</h3>
                <p style={{ color: '#000000', marginTop: '8px' }}>
                  <strong>Email:</strong> {employee.user.email}
                </p>
                <p style={{ color: '#000000' }}>
                  <strong>Mobile:</strong> {employee.personal?.mobile || 'N/A'}
                </p>
                <p style={{ color: '#000000' }}>
                  <strong>Submitted:</strong> {new Date(employee.user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="badge badge-pending">Pending</span>
            </div>
          ))
        )
      ) : (
        // Payroll Approvals Tab
        pendingPayrolls.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#000000' }}>
              No pending payrolls at the moment.
            </p>
          </div>
        ) : (
          pendingPayrolls.map((emp) => (
            <div 
              key={emp.user.id} 
              className="card employee-card"
              style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h3>{emp.personal?.fullName || 'N/A'} - {emp.user.emp_code}</h3>
                <p style={{ color: '#000000', marginTop: '8px' }}>
                  <strong>Email:</strong> {emp.user.email}
                </p>
                <p style={{ color: '#000000' }}>
                  <strong>Joined:</strong> {new Date(emp.user.dateJoined).toLocaleDateString()}
                </p>
                <p style={{ color: '#000000' }}>
                  <strong>Department:</strong> {emp.professional?.department || 'N/A'}
                </p>
                <p style={{ color: '#000000' }}>
                  <strong>Designation:</strong> {emp.professional?.jobTitle || 'N/A'}
                </p>
              </div>
              <div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => handleOpenPayrollModal(emp)}>
                  Add payroll
                </button>
              </div>
            </div>
          ))
        )
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ color: 'var(--ink)' }}>Add Payroll Details for {selectedEmpForPayroll?.user.emp_code}</h3>
            <form onSubmit={handlePayrollSubmit} style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>CTC (Annual):</label>
                <input 
                  type="number" 
                  name="ctc" 
                  value={payrollForm.ctc} 
                  onChange={handlePayrollChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Gross Salary (Monthly):</label>
                <input 
                  type="number" 
                  name="gross" 
                  value={payrollForm.gross} 
                  onChange={handlePayrollChange} 
                  required 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                  <input type="checkbox" name="pf" checked={payrollForm.pf} onChange={handlePayrollChange} style={{ width: 'auto' }} />
                  PF Applicable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                  <input type="checkbox" name="pt" checked={payrollForm.pt} onChange={handlePayrollChange} style={{ width: 'auto' }} />
                  PT Applicable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                  <input type="checkbox" name="esic" checked={payrollForm.esic} onChange={handlePayrollChange} style={{ width: 'auto' }} />
                  ESIC Applicable
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)' }}>
                  <input type="checkbox" name="tds" checked={payrollForm.tds} onChange={handlePayrollChange} style={{ width: 'auto' }} />
                  TDS Applicable
                </label>
              </div>

              <div className="page-actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayrollModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={payrollSubmitting}>
                  {payrollSubmitting ? 'Saving...' : 'Save payroll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPendingApprovals;
