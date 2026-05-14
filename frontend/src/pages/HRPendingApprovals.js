import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HRPendingApprovals = () => {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' or 'payrolls'
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('profiles')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'profiles' ? 'var(--teal-mid)' : '#f0f0f0',
            color: activeTab === 'profiles' ? '#fff' : '#333',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Profile Approvals ({activeTab === 'profiles' ? pendingEmployees.length : '...'})
        </button>
        <button 
          onClick={() => setActiveTab('payrolls')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'payrolls' ? 'var(--teal-mid)' : '#f0f0f0',
            color: activeTab === 'payrolls' ? '#fff' : '#333',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Payroll Approvals ({activeTab === 'payrolls' ? pendingPayrolls.length : '...'})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : activeTab === 'profiles' ? (
        // Profile Approvals Tab
        pendingEmployees.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#aab3bc' }}>
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
                <p style={{ color: '#666', marginTop: '8px' }}>
                  <strong>Email:</strong> {employee.user.email}
                </p>
                <p style={{ color: '#666' }}>
                  <strong>Mobile:</strong> {employee.personal?.mobile || 'N/A'}
                </p>
                <p style={{ color: '#666' }}>
                  <strong>Submitted:</strong> {new Date(employee.user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="badge badge-pending" style={{ background: 'var(--saffron)', color: '#fff', padding: '5px 10px', borderRadius: '4px' }}>Pending Profile</span>
            </div>
          ))
        )
      ) : (
        // Payroll Approvals Tab
        pendingPayrolls.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#aab3bc' }}>
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
                <p style={{ color: '#666', marginTop: '8px' }}>
                  <strong>Email:</strong> {emp.user.email}
                </p>
                <p style={{ color: '#666' }}>
                  <strong>Joined:</strong> {new Date(emp.user.dateJoined).toLocaleDateString()}
                </p>
              </div>
              <div>
                <button 
                  onClick={() => handleOpenPayrollModal(emp)}
                  style={{
                    background: 'var(--saffron-mid)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Add Payroll
                </button>
              </div>
            </div>
          ))
        )
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPayrollModal(false)}
                  style={{ padding: '8px 16px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer', borderRadius: '4px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={payrollSubmitting}
                  style={{ padding: '8px 16px', border: 'none', background: 'var(--teal-mid)', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
                >
                  {payrollSubmitting ? 'Saving...' : 'Save Payroll'}
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
