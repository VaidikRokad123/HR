import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const HREmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(null); // null or module name being edited
  const [formData, setFormData] = useState({});
  const [professionalData, setProfessionalData] = useState({
    dateJoined: '',
    department: '',
    jobTitle: '',
    reportingManager: '',
    workEmail: '',
    attendanceBiometricId: '',
    inProbation: true
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`/hr/employee/${id}`);
      setEmployeeData(response.data);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!professionalData.dateJoined || !professionalData.department || 
        !professionalData.jobTitle || !professionalData.workEmail) {
      alert('Please fill all required professional details before approving');
      return;
    }

    if (!window.confirm('Are you sure you want to approve this employee?')) {
      return;
    }

    try {
      await axios.put(`/hr/employee/${id}/approve`, professionalData);
      alert('Employee approved successfully!');
      navigate('/hr/pending');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve employee');
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.put(`/hr/employee/${id}/reject`);
      alert('Employee rejected successfully');
      navigate('/hr/pending');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject employee');
    }
  };

  const handleEdit = async (module) => {
    try {
      await axios.put(`/hr/employee/${id}/edit`, {
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
      [module]: {
        ...prev[module],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (module, parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [parent]: {
          ...prev[module][parent],
          [field]: value
        }
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

  if (error || !employeeData) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Employee not found'}</div>
      </div>
    );
  }

  const { user, personal, family, address, emergency, professional, bank } = employeeData;
  const isPending = user.status === 'pending_hr';

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{personal?.fullName || 'Employee Details'}</h1>
            <p>
              {user.emp_code ? `Employee Code: ${user.emp_code}` : 'Pending Approval'}
              {' '}
              <span className={`badge badge-${user.status === 'approved' ? 'approved' : 'pending'}`}>
                {user.status}
              </span>
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate(isPending ? '/hr/pending' : '/hr/all-employees')}
          >
            Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal
        </button>
        <button 
          className={`tab ${activeTab === 'family' ? 'active' : ''}`}
          onClick={() => setActiveTab('family')}
        >
          Family
        </button>
        <button 
          className={`tab ${activeTab === 'address' ? 'active' : ''}`}
          onClick={() => setActiveTab('address')}
        >
          Address
        </button>
        <button 
          className={`tab ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
        >
          Emergency
        </button>
        {isPending && (
          <button 
            className={`tab ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            Professional (Required)
          </button>
        )}
        {!isPending && professional && (
          <button 
            className={`tab ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            Professional
          </button>
        )}
        {!isPending && bank && (
          <button 
            className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            Bank
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'personal' && personal && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Personal Information</h3>
              {!isPending && (
                editMode === 'personal' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('personal')}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('personal')}>Edit</button>
                )
              )}
            </div>
            {editMode === 'personal' ? (
              <div className="grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.personal?.fullName || ''}
                    onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.personal?.gender || ''}
                    onChange={(e) => handleInputChange('personal', 'gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={formData.personal?.dob ? new Date(formData.personal.dob).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('personal', 'dob', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="text"
                    value={formData.personal?.mobile || ''}
                    onChange={(e) => handleInputChange('personal', 'mobile', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <input
                    type="text"
                    value={formData.personal?.bloodGroup || ''}
                    onChange={(e) => handleInputChange('personal', 'bloodGroup', e.target.value)}
                  />
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
            )}
          </div>
        )}

        {activeTab === 'family' && family && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Family Information</h3>
              {!isPending && (
                editMode === 'family' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('family')}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('family')}>Edit</button>
                )
              )}
            </div>
            {editMode === 'family' ? (
              <div className="grid-2">
                <div className="form-group">
                  <label>Father's Name</label>
                  <input
                    type="text"
                    value={formData.family?.fatherName || ''}
                    onChange={(e) => handleInputChange('family', 'fatherName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Mother's Name</label>
                  <input
                    type="text"
                    value={formData.family?.motherName || ''}
                    onChange={(e) => handleInputChange('family', 'motherName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Marital Status</label>
                  <select
                    value={formData.family?.maritalStatus || 'Single'}
                    onChange={(e) => handleInputChange('family', 'maritalStatus', e.target.value)}
                  >
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
                      <input
                        type="text"
                        value={formData.family?.spouseName || ''}
                        onChange={(e) => handleInputChange('family', 'spouseName', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Marriage Date</label>
                      <input
                        type="date"
                        value={formData.family?.marriageDate ? new Date(formData.family.marriageDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleInputChange('family', 'marriageDate', e.target.value)}
                      />
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
            )}
          </div>
        )}

        {activeTab === 'address' && address && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Address Information</h3>
              {!isPending && (
                editMode === 'address' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('address')}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('address')}>Edit</button>
                )
              )}
            </div>
            {editMode === 'address' ? (
              <>
                <h4>Current Address</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.street || ''}
                      onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'street', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.city || ''}
                      onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.state || ''}
                      onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'state', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.pincode || ''}
                      onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'pincode', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.country || ''}
                      onChange={(e) => handleNestedInputChange('address', 'currentAddress', 'country', e.target.value)}
                    />
                  </div>
                </div>
                
                <h4 style={{ marginTop: '16px' }}>Permanent Address</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.street || ''}
                      onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'street', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.city || ''}
                      onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'city', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.state || ''}
                      onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'state', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.pincode || ''}
                      onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'pincode', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.country || ''}
                      onChange={(e) => handleNestedInputChange('address', 'permanentAddress', 'country', e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
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
        )}

        {activeTab === 'emergency' && emergency && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Emergency Contacts</h3>
              {!isPending && (
                editMode === 'emergency' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => handleEdit('emergency')}>Save</button>
                    <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={() => startEdit('emergency')}>Edit</button>
                )
              )}
            </div>
            {editMode === 'emergency' ? (
              <>
                <h4>Primary Contact</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact1?.name || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      value={formData.emergency?.emergencyContact1?.relationship || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'relationship', e.target.value)}
                    >
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
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact1?.mobile || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact1', 'mobile', e.target.value)}
                    />
                  </div>
                </div>
                
                <h4 style={{ marginTop: '16px' }}>Secondary Contact</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact2?.name || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      value={formData.emergency?.emergencyContact2?.relationship || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'relationship', e.target.value)}
                    >
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
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact2?.mobile || ''}
                      onChange={(e) => handleNestedInputChange('emergency', 'emergencyContact2', 'mobile', e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
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
        )}

        {activeTab === 'professional' && isPending && (
          <div>
            <h3>Professional Details (Required for Approval)</h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Date Joined *</label>
                <input
                  type="date"
                  value={professionalData.dateJoined}
                  onChange={(e) => setProfessionalData({...professionalData, dateJoined: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={professionalData.department}
                  onChange={(e) => setProfessionalData({...professionalData, department: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  value={professionalData.jobTitle}
                  onChange={(e) => setProfessionalData({...professionalData, jobTitle: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Work Email *</label>
                <input
                  type="email"
                  value={professionalData.workEmail}
                  onChange={(e) => setProfessionalData({...professionalData, workEmail: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reporting Manager</label>
                <input
                  type="text"
                  value={professionalData.reportingManager}
                  onChange={(e) => setProfessionalData({...professionalData, reportingManager: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Biometric ID</label>
                <input
                  type="text"
                  value={professionalData.attendanceBiometricId}
                  onChange={(e) => setProfessionalData({...professionalData, attendanceBiometricId: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={professionalData.inProbation}
                      onChange={(e) => setProfessionalData({...professionalData, inProbation: e.target.checked})}
                    />
                    In Probation
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional' && !isPending && professional && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Professional Information</h3>
              {editMode === 'professional' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => handleEdit('professional')}>Save</button>
                  <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => startEdit('professional')}>Edit</button>
              )}
            </div>
            {editMode === 'professional' ? (
              <div className="grid-2">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.professional?.department || ''}
                    onChange={(e) => handleInputChange('professional', 'department', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={formData.professional?.jobTitle || ''}
                    onChange={(e) => handleInputChange('professional', 'jobTitle', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Date Joined</label>
                  <input
                    type="date"
                    value={formData.professional?.dateJoined ? new Date(formData.professional.dateJoined).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('professional', 'dateJoined', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Reporting Manager</label>
                  <input
                    type="text"
                    value={formData.professional?.reportingManager || ''}
                    onChange={(e) => handleInputChange('professional', 'reportingManager', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Work Email</label>
                  <input
                    type="email"
                    value={formData.professional?.workEmail || ''}
                    onChange={(e) => handleInputChange('professional', 'workEmail', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.professional?.linkedinUrl || ''}
                    onChange={(e) => handleInputChange('professional', 'linkedinUrl', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Biometric ID</label>
                  <input
                    type="text"
                    value={formData.professional?.attendanceBiometricId || ''}
                    onChange={(e) => handleInputChange('professional', 'attendanceBiometricId', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Name as per Aadhaar</label>
                  <input
                    type="text"
                    value={formData.professional?.nameAsPerAadhaar || ''}
                    onChange={(e) => handleInputChange('professional', 'nameAsPerAadhaar', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <div style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.professional?.inProbation || false}
                        onChange={(e) => handleInputChange('professional', 'inProbation', e.target.checked)}
                      />
                      In Probation
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid-2">
                <p><strong>Department:</strong> {professional.department}</p>
                <p><strong>Job Title:</strong> {professional.jobTitle}</p>
                <p><strong>Date Joined:</strong> {new Date(professional.dateJoined).toLocaleDateString()}</p>
                <p><strong>Reporting Manager:</strong> {professional.reportingManager || 'N/A'}</p>
                <p><strong>Work Email:</strong> {professional.workEmail}</p>
                {professional.linkedinUrl && (
                  <p><strong>LinkedIn:</strong> <a href={professional.linkedinUrl} target="_blank" rel="noopener noreferrer">View Profile</a></p>
                )}
                {professional.nameAsPerAadhaar && (
                  <p><strong>Name as per Aadhaar:</strong> {professional.nameAsPerAadhaar}</p>
                )}
                <p><strong>Probation Status:</strong> {professional.inProbation ? 'In Probation' : 'Confirmed'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bank' && bank && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Bank Details</h3>
              {editMode === 'bank' ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => handleEdit('bank')}>Save</button>
                  <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => startEdit('bank')}>Edit</button>
              )}
            </div>
            {editMode === 'bank' ? (
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)', textTransform: 'none' }}>
                    <input
                      type="checkbox"
                      checked={formData.bank?.companyOpensBank || false}
                      onChange={(e) => handleInputChange('bank', 'companyOpensBank', e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                    Company open bank account
                  </label>
                </div>
                
                {formData.bank?.companyOpensBank && (
                  <>
                    <div className="form-group">
                      <label>PAN Number</label>
                      <input
                        type="text"
                        value={formData.bank?.panNumber || ''}
                        onChange={(e) => handleInputChange('bank', 'panNumber', e.target.value)}
                        style={{ textTransform: 'uppercase' }}
                        maxLength="10"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhar Number</label>
                      <input
                        type="text"
                        value={formData.bank?.aadharNumber || ''}
                        onChange={(e) => handleInputChange('bank', 'aadharNumber', e.target.value)}
                        maxLength="12"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)', textTransform: 'none' }}>
                        <input
                          type="checkbox"
                          checked={formData.bank?.permissionToUsePanAadhar || false}
                          onChange={(e) => handleInputChange('bank', 'permissionToUsePanAadhar', e.target.checked)}
                          style={{ width: 'auto' }}
                        />
                        Permission granted to use PAN and Aadhar
                      </label>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank?.bankName || ''}
                    onChange={(e) => handleInputChange('bank', 'bankName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={formData.bank?.branch || ''}
                    onChange={(e) => handleInputChange('bank', 'branch', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Personal Account Number</label>
                  <input
                    type="text"
                    value={formData.bank?.personalAccountNumber || ''}
                    onChange={(e) => handleInputChange('bank', 'personalAccountNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Personal IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bank?.personalIfsc || ''}
                    onChange={(e) => handleInputChange('bank', 'personalIfsc', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Salary Account Number</label>
                  <input
                    type="text"
                    value={formData.bank?.salaryAccountNumber || ''}
                    onChange={(e) => handleInputChange('bank', 'salaryAccountNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Salary IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bank?.salaryIfsc || ''}
                    onChange={(e) => handleInputChange('bank', 'salaryIfsc', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid-2">
                {bank.companyOpensBank && (
                  <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                    <span className="badge badge-pending" style={{ background: 'var(--teal-mid)', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                      Company Opens Bank Account
                    </span>
                    <p style={{ marginTop: '10px' }}><strong>PAN Number:</strong> {bank.panNumber}</p>
                    <p><strong>Aadhar Number:</strong> {bank.aadharNumber}</p>
                    <p><strong>Permission Granted:</strong> {bank.permissionToUsePanAadhar ? 'Yes' : 'No'}</p>
                    <hr style={{ margin: '15px 0', borderColor: 'var(--border)' }} />
                  </div>
                )}
                <p><strong>Bank Name:</strong> {bank.bankName || 'Not Set'}</p>
                <p><strong>Branch:</strong> {bank.branch || 'Not Set'}</p>
                <p><strong>Personal Account:</strong> {bank.personalAccountNumber || 'Not Set'}</p>
                <p><strong>Personal IFSC:</strong> {bank.personalIfsc || 'Not Set'}</p>
                <p><strong>Salary Account:</strong> {bank.salaryAccountNumber || 'Not Set'}</p>
                <p><strong>Salary IFSC:</strong> {bank.salaryIfsc || 'Not Set'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-success" onClick={handleApprove}>
            Approve Employee
          </button>
          <button className="btn btn-danger" onClick={handleReject}>
            Reject Employee
          </button>
        </div>
      )}
    </div>
  );
};

export default HREmployeeDetail;
