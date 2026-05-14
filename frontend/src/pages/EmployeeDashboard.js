import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    <div className="container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Employee Code: <strong>{user.emp_code}</strong></p>
      </div>

      <div className="card">
        <h3>Personal Information</h3>
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

      <div className="card">
        <h3>Family Information</h3>
        {family && (
          <div className="grid-2">
            <p><strong>Father's Name:</strong> {family.fatherName}</p>
            <p><strong>Mother's Name:</strong> {family.motherName}</p>
            <p><strong>Marital Status:</strong> {family.married ? 'Married' : 'Single'}</p>
            {family.married && (
              <>
                <p><strong>Spouse Name:</strong> {family.spouseName}</p>
                <p><strong>Marriage Date:</strong> {family.marriageDate ? new Date(family.marriageDate).toLocaleDateString() : 'N/A'}</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Address</h3>
        {address && (
          <>
            <h4>Current Address</h4>
            <p>
              {address.currentAddress.street}, {address.currentAddress.city}, 
              {address.currentAddress.state} - {address.currentAddress.pincode}, 
              {address.currentAddress.country}
            </p>
            
            <h4 style={{ marginTop: '16px' }}>Permanent Address</h4>
            <p>
              {address.permanentAddress.street}, {address.permanentAddress.city}, 
              {address.permanentAddress.state} - {address.permanentAddress.pincode}, 
              {address.permanentAddress.country}
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h3>Emergency Contacts</h3>
        {emergency && (
          <>
            <h4>Primary Contact</h4>
            <div className="grid-2">
              <p><strong>Name:</strong> {emergency.emergencyContact1.name}</p>
              <p><strong>Relationship:</strong> {emergency.emergencyContact1.relationship}</p>
              <p><strong>Mobile:</strong> {emergency.emergencyContact1.mobile}</p>
            </div>
            
            {emergency.emergencyContact2 && emergency.emergencyContact2.name && (
              <>
                <h4 style={{ marginTop: '16px' }}>Secondary Contact</h4>
                <div className="grid-2">
                  <p><strong>Name:</strong> {emergency.emergencyContact2.name}</p>
                  <p><strong>Relationship:</strong> {emergency.emergencyContact2.relationship}</p>
                  <p><strong>Mobile:</strong> {emergency.emergencyContact2.mobile}</p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {professional && (
        <div className="card">
          <h3>Professional Information</h3>
          <div className="grid-2">
            <p><strong>Department:</strong> {professional.department}</p>
            <p><strong>Job Title:</strong> {professional.jobTitle}</p>
            <p><strong>Date Joined:</strong> {new Date(professional.dateJoined).toLocaleDateString()}</p>
            <p><strong>Reporting Manager:</strong> {professional.reportingManager || 'N/A'}</p>
            <p><strong>Work Email:</strong> {professional.workEmail}</p>
            <p><strong>LinkedIn:</strong> <a href={professional.linkedinUrl} target="_blank" rel="noopener noreferrer">View Profile</a></p>
            <p><strong>Probation Status:</strong> {professional.inProbation ? 'In Probation' : 'Confirmed'}</p>
            {professional.nameAsPerAadhaar && (
              <p><strong>Name as per Aadhaar:</strong> {professional.nameAsPerAadhaar}</p>
            )}
          </div>
        </div>
      )}

      {bank && (
        <div className="card">
          <h3>Bank Details</h3>
          <div className="grid-2">
            <p><strong>Bank Name:</strong> {bank.bankName}</p>
            <p><strong>Branch:</strong> {bank.branch}</p>
            <p><strong>Account Number:</strong> {bank.personalAccountNumber}</p>
            <p><strong>IFSC Code:</strong> {bank.personalIfsc}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
