import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './EmployeeDashboard.css'; // Make sure to import the new CSS

const EmployeeDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get('/employee/my-details');
      setEmployeeData(response.data);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (module) => {
    try {
      await axios.put(`/employee/edit`, {
        module,
        data: formData[module]
      });
      alert(`${module} details updated successfully`);
      fetchEmployeeData();
      setEditMode(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update details');
    }
  };

  const handleInputChange = (module, field, value) => {
    setFormData(prev => ({
      ...prev,
      [module]: { ...prev[module], [field]: value }
    }));
  };

  const handleNestedInputChange = (module, parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [parent]: { ...prev[module][parent], [field]: value }
      }
    }));
  };

  const startEdit = (module) => {
    setEditMode(module);
  };

  const cancelEdit = () => {
    setFormData(employeeData);
    setEditMode(null);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Personal Information</h4>
                {editMode === 'personal' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('personal')} style={{ padding: '4px 12px', fontSize: '14px' }}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit} style={{ padding: '4px 12px', fontSize: '14px' }}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('personal')} style={{ padding: '4px 12px', fontSize: '14px' }}>Edit</button>
                )}
              </div>
              {personal && (
                editMode === 'personal' ? (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={formData.personal?.fullName || ''} onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select value={formData.personal?.gender || ''} onChange={(e) => handleInputChange('personal', 'gender', e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" value={formData.personal?.dob ? new Date(formData.personal.dob).toISOString().split('T')[0] : ''} onChange={(e) => handleInputChange('personal', 'dob', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Mobile</label>
                      <input type="text" value={formData.personal?.mobile || ''} onChange={(e) => handleInputChange('personal', 'mobile', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <input type="text" value={formData.personal?.bloodGroup || ''} onChange={(e) => handleInputChange('personal', 'bloodGroup', e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid-2">
                    <p><strong>Full Name:</strong> {personal.fullName}</p>
                    <p><strong>Gender:</strong> {personal.gender}</p>
                    <p><strong>Date of Birth:</strong> {new Date(personal.dob).toLocaleDateString()}</p>
                    <p><strong>Age:</strong> {personal.age} years</p>
                    <p><strong>Mobile:</strong> {personal.mobile}</p>
                    <p><strong>Blood Group:</strong> {personal.bloodGroup}</p>
                  </div>
                )
              )}
            </div>
            
            <hr className="divider" />
            
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Family Information</h4>
                {editMode === 'family' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('family')} style={{ padding: '4px 12px', fontSize: '14px' }}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit} style={{ padding: '4px 12px', fontSize: '14px' }}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('family')} style={{ padding: '4px 12px', fontSize: '14px' }}>Edit</button>
                )}
              </div>
              {family && (
                editMode === 'family' ? (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Father's Name</label>
                      <input type="text" value={formData.family?.fatherName || ''} onChange={(e) => handleInputChange('family', 'fatherName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Mother's Name</label>
                      <input type="text" value={formData.family?.motherName || ''} onChange={(e) => handleInputChange('family', 'motherName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Marital Status</label>
                      <select value={formData.family?.maritalStatus || 'Single'} onChange={(e) => handleInputChange('family', 'maritalStatus', e.target.value)}>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>
                    {formData.family?.maritalStatus === 'Married' && (
                      <>
                        <div className="form-group">
                          <label>Spouse Name</label>
                          <input type="text" value={formData.family?.spouseName || ''} onChange={(e) => handleInputChange('family', 'spouseName', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>Marriage Date</label>
                          <input type="date" value={formData.family?.marriageDate ? new Date(formData.family.marriageDate).toISOString().split('T')[0] : ''} onChange={(e) => handleInputChange('family', 'marriageDate', e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
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
                )
              )}
            </div>
            
            <hr className="divider" />
            
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Address</h4>
                {editMode === 'address' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('address')} style={{ padding: '4px 12px', fontSize: '14px' }}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit} style={{ padding: '4px 12px', fontSize: '14px' }}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('address')} style={{ padding: '4px 12px', fontSize: '14px' }}>Edit</button>
                )}
              </div>
              {address && (
                editMode === 'address' ? (
                  <>
                    <h5 style={{ color: 'var(--saffron)', marginTop: '10px', marginBottom: '10px' }}>Current Address</h5>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Street</label>
                        <input type="text" value={formData.address?.currentAddress?.street || ''} onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'street', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" value={formData.address?.currentAddress?.city || ''} onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'city', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" value={formData.address?.currentAddress?.state || ''} onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'state', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input type="text" value={formData.address?.currentAddress?.pincode || ''} onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'pincode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input type="text" value={formData.address?.currentAddress?.country || ''} onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'country', e.target.value)} />
                      </div>
                    </div>
                    
                    <h5 style={{ color: 'var(--saffron)', marginTop: '20px', marginBottom: '10px' }}>Permanent Address</h5>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Street</label>
                        <input type="text" value={formData.address?.permanentAddress?.street || ''} onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'street', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" value={formData.address?.permanentAddress?.city || ''} onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'city', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" value={formData.address?.permanentAddress?.state || ''} onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'state', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input type="text" value={formData.address?.permanentAddress?.pincode || ''} onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'pincode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input type="text" value={formData.address?.permanentAddress?.country || ''} onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'country', e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
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
                )
              )}
            </div>

            <hr className="divider" />
            
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Emergency Contacts</h4>
                {editMode === 'emergency' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('emergency')} style={{ padding: '4px 12px', fontSize: '14px' }}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit} style={{ padding: '4px 12px', fontSize: '14px' }}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('emergency')} style={{ padding: '4px 12px', fontSize: '14px' }}>Edit</button>
                )}
              </div>
              {emergency && (
                editMode === 'emergency' ? (
                  <>
                    <h5 style={{ color: 'var(--saffron)', marginTop: '10px', marginBottom: '10px' }}>Primary Contact</h5>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={formData.emergency?.emergencyContact1?.name || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Relationship</label>
                        <select value={formData.emergency?.emergencyContact1?.relationship || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'relationship', e.target.value)}>
                          <option value="">Select Relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Mobile</label>
                        <input type="text" value={formData.emergency?.emergencyContact1?.mobile || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'mobile', e.target.value)} />
                      </div>
                    </div>
                    
                    <h5 style={{ color: 'var(--saffron)', marginTop: '20px', marginBottom: '10px' }}>Secondary Contact</h5>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={formData.emergency?.emergencyContact2?.name || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Relationship</label>
                        <select value={formData.emergency?.emergencyContact2?.relationship || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'relationship', e.target.value)}>
                          <option value="">Select Relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                          <option value="Friend">Friend</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Mobile</label>
                        <input type="text" value={formData.emergency?.emergencyContact2?.mobile || ''} onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'mobile', e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
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
                )
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
