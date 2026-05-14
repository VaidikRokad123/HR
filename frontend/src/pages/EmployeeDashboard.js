import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeDashboard.css'; // Make sure to import the new CSS

const EmployeeDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get('/employee/my-details');
      setEmployeeData(response.data);
    } catch (err) {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="container"><div className="alert alert-error">{error}</div></div>;
  }

  if (!employeeData) {
    return <div className="container"><div className="alert alert-error">No data found</div></div>;
  }

  const { user, personal, family, address, emergency, professional, bank } = employeeData;

  return (
    <div className="container dashboard-wrapper">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>My Profile</h1>
        <p>Employee Code: <strong>{user.emp_code}</strong></p>
      </div>

      <div className="profile-layout">
        {/* Left Column */}
        <div className="profile-column left-column">
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '18px', borderBottom: '2px solid var(--saffron)', paddingBottom: '10px' }}>Personal Details</h3>
            
            <div className="section">
              <h4>Personal Information</h4>
              {personal && (
                <div className="grid-2">
                  <p><strong>Full Name:</strong> {personal.fullName}</p>
                  <p><strong>Gender:</strong> {personal.gender}</p>
                  <p><strong>Date of Birth:</strong> {new Date(personal.dob).toLocaleDateString()}</p>
                  <p><strong>Age:</strong> {personal.age} years</p>
                  <p><strong>Mobile:</strong> {personal.mobile}</p>
                  <p><strong>Blood Group:</strong> {personal.bloodGroup}</p>
                </div>
              )}
            </div>
            
            <hr className="divider" />
            
            <div className="section">
              <h4>Family Information</h4>
              {family && (
                <div className="grid-2">
                  <p><strong>Father's Name:</strong> {family.fatherName}</p>
                  <p><strong>Mother's Name:</strong> {family.motherName}</p>
                  <p><strong>Marital Status:</strong> {family.maritalStatus}</p>
                  {family.maritalStatus === 'Married' && (
                    <>
                      <p><strong>Spouse Name:</strong> {family.spouseName}</p>
                      <p><strong>Marriage Date:</strong> {family.marriageDate ? new Date(family.marriageDate).toLocaleDateString() : 'N/A'}</p>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <hr className="divider" />
            
            <div className="section">
              <h4>Address</h4>
              {address && (
                <>
                  <div className="address-block">
                    <h5>Current Address</h5>
                    <p>
                      {address.currentAddress.street}, {address.currentAddress.city}, 
                      {address.currentAddress.state} - {address.currentAddress.pincode}, 
                      {address.currentAddress.country}
                    </p>
                  </div>
                  
                  <div className="address-block" style={{ marginTop: '16px' }}>
                    <h5>Permanent Address</h5>
                    <p>
                      {address.permanentAddress.street}, {address.permanentAddress.city}, 
                      {address.permanentAddress.state} - {address.permanentAddress.pincode}, 
                      {address.permanentAddress.country}
                    </p>
                  </div>
                </>
              )}
            </div>

            <hr className="divider" />
            
            <div className="section">
              <h4>Emergency Contacts</h4>
              {emergency && (
                <>
                  <div className="contact-block">
                    <h5>Primary Contact</h5>
                    <div className="grid-2">
                      <p><strong>Name:</strong> {emergency.emergencyContact1.name}</p>
                      <p><strong>Relationship:</strong> {emergency.emergencyContact1.relationship}</p>
                      <p><strong>Mobile:</strong> {emergency.emergencyContact1.mobile}</p>
                    </div>
                  </div>
                  
                  {emergency.emergencyContact2 && emergency.emergencyContact2.name && (
                    <div className="contact-block" style={{ marginTop: '16px' }}>
                      <h5>Secondary Contact</h5>
                      <div className="grid-2">
                        <p><strong>Name:</strong> {emergency.emergencyContact2.name}</p>
                        <p><strong>Relationship:</strong> {emergency.emergencyContact2.relationship}</p>
                        <p><strong>Mobile:</strong> {emergency.emergencyContact2.mobile}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-column right-column">
          {professional && (
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '18px', borderBottom: '2px solid var(--saffron)', paddingBottom: '10px' }}>Professional Information</h3>
              <div className="grid-2">
                <p><strong>Department:</strong> {professional.department}</p>
                <p><strong>Job Title:</strong> {professional.jobTitle}</p>
                <p><strong>Date Joined:</strong> {new Date(professional.dateJoined).toLocaleDateString()}</p>
                <p><strong>Reporting Manager:</strong> {professional.reportingManager || 'N/A'}</p>
                <p><strong>Work Email:</strong> {professional.workEmail}</p>
                <p><strong>LinkedIn:</strong> <a href={professional.linkedinUrl} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                <p><strong>Probation Status:</strong> {professional.inProbation ? `In Probation (${professional.probationDuration ? `${professional.probationDuration} Month(s)` : 'Duration Not Set'})` : 'Confirmed'}</p>
                {professional.nameAsPerAadhaar && (
                  <p><strong>Name as per Aadhaar:</strong> {professional.nameAsPerAadhaar}</p>
                )}
              </div>
            </div>
          )}

          {bank && (
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '18px', borderBottom: '2px solid var(--saffron)', paddingBottom: '10px' }}>Bank Details</h3>
              <div className="grid-2">
                {bank.companyOpensBank ? (
                  <>
                    <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                      <span className="badge badge-pending" style={{ background: 'var(--teal-mid)', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        Company Opens Bank Account
                      </span>
                    </div>
                    <p><strong>PAN Number:</strong> {bank.panNumber}</p>
                    <p><strong>Aadhar Number:</strong> {bank.aadharNumber}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Bank Name:</strong> {bank.bankName}</p>
                    <p><strong>Branch:</strong> {bank.branch}</p>
                    <p><strong>Account Number:</strong> {bank.personalAccountNumber}</p>
                    <p><strong>IFSC Code:</strong> {bank.personalIfsc}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
