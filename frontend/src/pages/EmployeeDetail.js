import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import './EmployeeDetail.css';

const departmentOptions = [
  "Product & Delivery",
  "Human Resources",
  "Sales & marketing",
  "Design",
  "Engineering"
];

const designationOptions = [
  "SR Quality Assurance Engineer",
  "Team Lead - Software Development",
  "Software Development Engineer - SDE 3",
  "Software Development Engineer - SDE 2",
  "Software Development Engineer - SDE 1",
  "Software Development - Intern",
  "Jr. Video Editor",
  "Sr. Human Resource Executive",
  "Product Manager",
  "Team Lead",
  "Jr Human Resource Executive",
  "Sr. BDE",
  "Sr. UI/UX",
  "Intern-Graphics",
  "Intern - UI/UX UI/UX Designer",
  "Quality Assurance Engineer",
  "Quality Assurance - Intern",
  "JR Quality Assurance Engineer"
];

const employmentTypeOptions = [
  "Temporary",
  "Permanent",
  "Contract Base",
  "Probation",
  "Internship",
  "Trainee",
  "Notice period"
];

const TABS = [
  { id: 'personal', label: 'Personal info' },
  { id: 'employee', label: 'Employee details' },
  { id: 'payroll', label: 'Payroll details' },
  { id: 'documents', label: 'Documents' },
  { id: 'payroll-history', label: 'Payroll history' },
];

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatAddress = (addr) => {
  if (!addr) return 'N/A';
  const parts = [addr.street, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'N/A';
};

const DetailCard = ({ title, canEdit, isEditing, onEdit, onSave, onCancel, children }) => (
  <div className="ed-card">
    <div className="ed-card-head">
      <h3 className="ed-card-title">{title}</h3>
      {canEdit && (
        <div className="ed-card-actions">
          {isEditing ? (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>Save</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
            </>
          ) : (
            <button type="button" className="btn-icon" onClick={onEdit} aria-label={`Edit ${title}`}>
              <i className="ti ti-pencil" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div className="ed-field">
    <div className="ed-field-label">{label}</div>
    <div className="ed-field-value">{value || 'N/A'}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="ed-detail-item">
    <span className="ed-meta-label">{label}</span>
    <span className="ed-meta-value">{value || 'N/A'}</span>
  </div>
);

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState({});
  const [referenceOptions, setReferenceOptions] = useState({
    departments: departmentOptions,
    designations: designationOptions,
    employmentTypes: employmentTypeOptions
  });
  const [sensitiveDetails, setSensitiveDetails] = useState({ bank: null, payroll: null, unlocked: false });
  const [otpState, setOtpState] = useState({
    sending: false,
    verifying: false,
    requested: false,
    otp: '',
    message: '',
    error: ''
  });

  const fetchReferenceOptions = useCallback(async () => {
    try {
      const response = await axios.get('/auth/ref');
      setReferenceOptions({
        departments: response.data.departments || departmentOptions,
        designations: response.data.designations || designationOptions,
        employmentTypes: response.data.employmentTypes || employmentTypeOptions
      });
    } catch (err) {
      console.warn('Failed to load reference options, using defaults.');
    }
  }, []);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`/employees/${id}`);
      setEmployeeData(response.data);
      setFormData(response.data);
      setSensitiveDetails({ bank: null, payroll: null, unlocked: false });
      setOtpState({
        sending: false,
        verifying: false,
        requested: false,
        otp: '',
        message: '',
        error: ''
      });
    } catch (err) {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployeeData();
    fetchReferenceOptions();
  }, [fetchEmployeeData, fetchReferenceOptions]);

  const requestSensitiveOtp = async () => {
    setOtpState(prev => ({ ...prev, sending: true, error: '', message: '' }));
    try {
      const response = await axios.post(`/employees/${id}/sensitive-otp`);
      setOtpState(prev => ({
        ...prev,
        sending: false,
        requested: true,
        message: response.data?.message || 'OTP sent to admin email',
        error: ''
      }));
    } catch (err) {
      setOtpState(prev => ({
        ...prev,
        sending: false,
        error: err.response?.data?.message || 'Failed to send OTP'
      }));
    }
  };

  const verifySensitiveOtp = async () => {
    if (!otpState.otp || otpState.otp.length !== 6) {
      setOtpState(prev => ({ ...prev, error: 'Enter the 6-digit OTP' }));
      return;
    }

    setOtpState(prev => ({ ...prev, verifying: true, error: '', message: '' }));
    try {
      const response = await axios.post(`/employees/${id}/sensitive-verify`, {
        otp: otpState.otp
      });
      const unlocked = {
        bank: response.data?.bank || null,
        payroll: response.data?.payroll || null,
        unlocked: true
      };
      setSensitiveDetails(unlocked);
      setEmployeeData(prev => ({
        ...prev,
        bank: unlocked.bank,
        payroll: unlocked.payroll,
        sensitiveDetailsLocked: false
      }));
      setFormData(prev => ({
        ...prev,
        bank: unlocked.bank,
        payroll: unlocked.payroll
      }));
      setOtpState(prev => ({
        ...prev,
        verifying: false,
        requested: false,
        otp: '',
        message: 'Sensitive details unlocked',
        error: ''
      }));
    } catch (err) {
      setOtpState(prev => ({
        ...prev,
        verifying: false,
        error: err.response?.data?.message || 'Invalid OTP'
      }));
    }
  };

  const handleEdit = async (module) => {
    try {
      await axios.put(`/employees/${id}/edit`, {
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

  const startEdit = (module) => setEditMode(module);

  const cancelEdit = () => {
    setFormData(employeeData);
    setEditMode(null);
  };

  if (loading) {
    return <div className="loading">Loading</div>;
  }

  if (error || !employeeData) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Employee not found'}</div>
      </div>
    );
  }

  const { user, personal, family, address, emergency, professional, bank, payroll } = employeeData;
  const isPending = false;
  const canEdit = true;
  const normalizedStatus = user.status === 'rejected' ? 'rejected' : 'approved';
  const displayName = personal?.fullName || 'Employee Details';
  const workEmail = professional?.workEmail || user.email;
  const personalEmail = personal?.personalEmail || user.email;
  const unlockedBank = sensitiveDetails.bank || bank;
  const unlockedPayroll = sensitiveDetails.payroll || payroll;
  const hasBankDetails = employeeData.hasBankDetails || Boolean(unlockedBank);
  const hasPayrollDetails = employeeData.hasPayrollDetails || Boolean(unlockedPayroll);
  const completionPercentage = Number(employeeData.completionPercentage || 0);

  const renderSensitiveGate = (title, description) => (
    <DetailCard title={title} canEdit={false}>
      <div className="ed-sensitive-gate">
        <div className="ed-sensitive-icon">
          <i className="ti ti-lock" aria-hidden="true" />
        </div>
        <div className="ed-sensitive-copy">
          <h4>{description}</h4>
          <p>Send an OTP to the admin email and verify it to view these details.</p>
          {otpState.message && <div className="ed-sensitive-success">{otpState.message}</div>}
          {otpState.error && <div className="ed-sensitive-error">{otpState.error}</div>}
          <div className="ed-sensitive-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={requestSensitiveOtp}
              disabled={otpState.sending}
            >
              {otpState.sending ? 'Sending...' : 'Send OTP'}
            </button>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otpState.otp}
              onChange={(e) =>
                setOtpState(prev => ({
                  ...prev,
                  otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                  error: ''
                }))
              }
              placeholder="6-digit OTP"
              aria-label="Sensitive details OTP"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={verifySensitiveOtp}
              disabled={otpState.verifying || otpState.otp.length !== 6}
            >
              {otpState.verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </DetailCard>
  );

  const renderPersonalTab = () => (
    <>
      <h2 className="ed-tab-section-title">Personal info</h2>

      {personal && (
        <DetailCard
          title="Basic information"
          canEdit={canEdit}
          isEditing={editMode === 'personal'}
          onEdit={() => startEdit('personal')}
          onSave={() => handleEdit('personal')}
          onCancel={cancelEdit}
        >
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
              <div className="form-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  value={formData.personal?.personalEmail || ''}
                  onChange={(e) => handleInputChange('personal', 'personalEmail', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="ed-basic">
              <div className="ed-basic-main">
                <div className="ed-basic-name">{personal.fullName}</div>
                <div className="ed-basic-id">
                  {user.emp_code || user.id}
                </div>
                <div className="ed-basic-contacts">
                  <div className="ed-contact-row">
                    <i className="ti ti-gender-bigender" aria-hidden="true" />
                    <span>{personal.gender}</span>
                  </div>
                  <div className="ed-contact-row">
                    <i className="ti ti-mail" aria-hidden="true" />
                    <span>{personalEmail}</span>
                  </div>
                  <div className="ed-contact-row">
                    <i className="ti ti-phone" aria-hidden="true" />
                    <span>{personal.mobile}</span>
                  </div>
                </div>
              </div>
              <div className="ed-basic-divider" aria-hidden="true" />
              <div className="ed-basic-meta">
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Birth date</span>
                  <span className="ed-meta-value">{formatDate(personal.dob)}</span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Age</span>
                  <span className="ed-meta-value">{personal.age != null ? `${personal.age} years` : 'N/A'}</span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Blood type</span>
                  <span className="ed-meta-value">{personal.bloodGroup || 'N/A'}</span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Marital status</span>
                  <span className="ed-meta-value">{family?.maritalStatus || 'N/A'}</span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Status</span>
                  <span className="ed-meta-value">
                    <span className={`badge badge-${normalizedStatus}`}>
                      {normalizedStatus === 'approved' ? 'Active' : 'Rejected'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </DetailCard>
      )}

      <div className="ed-grid-2">
        {address && (
          <DetailCard
            title="Address"
            canEdit={canEdit}
            isEditing={editMode === 'address'}
            onEdit={() => startEdit('address')}
            onSave={() => handleEdit('address')}
            onCancel={cancelEdit}
          >
            {editMode === 'address' ? (
              <>
                <h4 className="ed-subsection-title">Current address</h4>
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
                <h4 className="ed-subsection-title">Permanent address</h4>
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
                <Field label="Current address" value={formatAddress(address.currentAddress)} />
                <Field label="Permanent address" value={formatAddress(address.permanentAddress)} />
              </>
            )}
          </DetailCard>
        )}

        {emergency && (
          <DetailCard
            title="Emergency contact"
            canEdit={canEdit}
            isEditing={editMode === 'emergency'}
            onEdit={() => startEdit('emergency')}
            onSave={() => handleEdit('emergency')}
            onCancel={cancelEdit}
          >
            {editMode === 'emergency' ? (
              <>
                <h4 className="ed-subsection-title">Primary contact</h4>
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
                <h4 className="ed-subsection-title">Secondary contact</h4>
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
                <Field label="Name" value={emergency.emergencyContact1?.name} />
                <Field label="Relationship" value={emergency.emergencyContact1?.relationship} />
                <Field label="Phone number" value={emergency.emergencyContact1?.mobile} />
                {emergency.emergencyContact2?.name && (
                  <>
                    <h4 className="ed-subsection-title">Secondary contact</h4>
                    <Field label="Name" value={emergency.emergencyContact2.name} />
                    <Field label="Relationship" value={emergency.emergencyContact2.relationship} />
                    <Field label="Phone number" value={emergency.emergencyContact2.mobile} />
                  </>
                )}
              </>
            )}
          </DetailCard>
        )}
      </div>

      {family && (
        <DetailCard
          title="Family"
          canEdit={canEdit}
          isEditing={editMode === 'family'}
          onEdit={() => startEdit('family')}
          onSave={() => handleEdit('family')}
          onCancel={cancelEdit}
        >
          {editMode === 'family' ? (
            <div className="grid-2">
              <div className="form-group">
                <label>Father&apos;s Name</label>
                <input
                  type="text"
                  value={formData.family?.fatherName || ''}
                  onChange={(e) => handleInputChange('family', 'fatherName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mother&apos;s Name</label>
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
            <div className="table-wrap">
              <table className="ed-family-table">
                <thead>
                  <tr>
                    <th>Family type</th>
                    <th>Person name</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Father</td>
                    <td>{family.fatherName}</td>
                  </tr>
                  <tr>
                    <td>Mother</td>
                    <td>{family.motherName}</td>
                  </tr>
                  {family.maritalStatus === 'Married' && family.spouseName && (
                    <tr>
                      <td>Spouse</td>
                      <td>{family.spouseName}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DetailCard>
      )}
    </>
  );

  const renderEmployeeTab = () => (
    <>
      <h2 className="ed-tab-section-title">Employee details</h2>

      {professional ? (
        <DetailCard
          title="Professional information"
          canEdit={canEdit}
          isEditing={editMode === 'professional'}
          onEdit={() => startEdit('professional')}
          onSave={() => handleEdit('professional')}
          onCancel={cancelEdit}
        >
          {editMode === 'professional' ? (
            <div className="grid-2">
              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.professional?.department || ''}
                  onChange={(e) => handleInputChange('professional', 'department', e.target.value)}
                >
                  <option value="">Select Department</option>
                  {referenceOptions.departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <select
                  value={formData.professional?.jobTitle || ''}
                  onChange={(e) => handleInputChange('professional', 'jobTitle', e.target.value)}
                >
                  <option value="">Select Designation</option>
                  {referenceOptions.designations.map(title => <option key={title} value={title}>{title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Employment Type</label>
                <select
                  value={formData.professional?.employmentType || ''}
                  onChange={(e) => handleInputChange('professional', 'employmentType', e.target.value)}
                >
                  <option value="">Select Employment Type</option>
                  {referenceOptions.employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
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
                  <label className="checkbox-label" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.professional?.inProbation || false}
                      onChange={(e) => handleInputChange('professional', 'inProbation', e.target.checked)}
                    />
                    In Probation
                  </label>
                </div>
              </div>
              {formData.professional?.inProbation && (
                <div className="form-group">
                  <label>Probation Duration (in months)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Enter months (e.g., 3)"
                    value={formData.professional?.probationDuration || ''}
                    onChange={(e) => handleInputChange('professional', 'probationDuration', e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="ed-detail-grid">
              <DetailItem label="Employee code" value={user.emp_code} />
              <DetailItem label="Department" value={professional.department} />
              <DetailItem label="Job title" value={professional.jobTitle} />
              <DetailItem label="Employment type" value={professional.employmentType} />
              <DetailItem label="Date joined" value={formatDate(professional.dateJoined)} />
              <DetailItem label="Reporting manager" value={professional.reportingManager} />
              <DetailItem label="Work email" value={workEmail} />
              <DetailItem label="Biometric ID" value={professional.attendanceBiometricId} />
              {professional.linkedinUrl && (
                <DetailItem
                  label="LinkedIn"
                  value={
                    <a href={professional.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      View profile
                    </a>
                  }
                />
              )}
              {professional.nameAsPerAadhaar && (
                <DetailItem label="Name as per Aadhaar" value={professional.nameAsPerAadhaar} />
              )}
              <DetailItem
                label="Probation status"
                value={
                  professional.inProbation
                    ? `In probation (${professional.probationDuration ? `${professional.probationDuration} month(s)` : 'duration not set'})`
                    : 'Confirmed'
                }
              />
            </div>
          )}
        </DetailCard>
      ) : (
        <div className="ed-empty-tab">
          No professional details available yet. Use the fill-details action above to complete this profile.
        </div>
      )}

      {!isPending && hasBankDetails && !unlockedBank && renderSensitiveGate(
        'Bank details',
        'Bank details are protected'
      )}

      {!isPending && unlockedBank && (
        <DetailCard
          title="Bank details"
          canEdit={canEdit}
          isEditing={editMode === 'bank'}
          onEdit={() => startEdit('bank')}
          onSave={() => handleEdit('bank')}
          onCancel={cancelEdit}
        >
          {editMode === 'bank' ? (
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="checkbox-label" style={{ textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={formData.bank?.companyOpensBank || false}
                    onChange={(e) => handleInputChange('bank', 'companyOpensBank', e.target.checked)}
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
                    <label className="checkbox-label" style={{ textTransform: 'none' }}>
                      <input
                        type="checkbox"
                        checked={formData.bank?.permissionToUsePanAadhar || false}
                        onChange={(e) => handleInputChange('bank', 'permissionToUsePanAadhar', e.target.checked)}
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
            <div className="ed-detail-grid">
              {unlockedBank.companyOpensBank && (
                <>
                  <DetailItem label="Company opens bank" value="Yes" />
                  <DetailItem label="PAN number" value={unlockedBank.panNumber} />
                  <DetailItem label="Aadhar number" value={unlockedBank.aadharNumber} />
                  <DetailItem label="Permission granted" value={unlockedBank.permissionToUsePanAadhar ? 'Yes' : 'No'} />
                </>
              )}
              <DetailItem label="Bank name" value={unlockedBank.bankName} />
              <DetailItem label="Account holder" value={unlockedBank.accountHolderName} />
              <DetailItem label="Branch" value={unlockedBank.branch} />
              <DetailItem label="Personal account" value={unlockedBank.personalAccountNumber} />
              <DetailItem label="Personal IFSC" value={unlockedBank.personalIfsc} />
              <DetailItem label="Salary account" value={unlockedBank.salaryAccountNumber} />
              <DetailItem label="Salary IFSC" value={unlockedBank.salaryIfsc} />
            </div>
          )}
        </DetailCard>
      )}

      {!isPending && !professional && !hasBankDetails && (
        <div className="ed-empty-tab">No employee details available.</div>
      )}
    </>
  );

  const renderPayrollTab = () => (
    <>
      <h2 className="ed-tab-section-title">Payroll details</h2>
      {!isPending && hasPayrollDetails && !unlockedPayroll ? (
        renderSensitiveGate('Payroll information', 'Payroll details are protected')
      ) : !isPending && unlockedPayroll ? (
        <DetailCard 
          title="Payroll information" 
          canEdit={canEdit}
          isEditing={editMode === 'payroll'}
          onEdit={() => startEdit('payroll')}
          onSave={() => handleEdit('payroll')}
          onCancel={cancelEdit}
        >
          {editMode === 'payroll' ? (
            <div className="ed-form-grid">
              <div className="ed-field">
                <label className="ed-label">CTC</label>
                <input 
                  type="number"
                  className="ed-input" 
                  value={formData.payroll?.ctc || ''} 
                  onChange={e => handleNestedInputChange('payroll', null, 'ctc', e.target.value)} 
                />
              </div>
              <div className="ed-field">
                <label className="ed-label">Gross salary</label>
                <input 
                  type="number"
                  className="ed-input" 
                  value={formData.payroll?.gross || ''} 
                  onChange={e => handleNestedInputChange('payroll', null, 'gross', e.target.value)} 
                />
              </div>
              <div className="ed-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.payroll?.pf || false} 
                  onChange={e => handleNestedInputChange('payroll', null, 'pf', e.target.checked)} 
                />
                <label className="ed-label" style={{ margin: 0 }}>PF Applicable</label>
              </div>
              <div className="ed-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.payroll?.pt || false} 
                  onChange={e => handleNestedInputChange('payroll', null, 'pt', e.target.checked)} 
                />
                <label className="ed-label" style={{ margin: 0 }}>PT Applicable</label>
              </div>
              <div className="ed-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.payroll?.esic || false} 
                  onChange={e => handleNestedInputChange('payroll', null, 'esic', e.target.checked)} 
                />
                <label className="ed-label" style={{ margin: 0 }}>ESIC Applicable</label>
              </div>
              <div className="ed-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={formData.payroll?.tds || false} 
                  onChange={e => handleNestedInputChange('payroll', null, 'tds', e.target.checked)} 
                />
                <label className="ed-label" style={{ margin: 0 }}>TDS Applicable</label>
              </div>
            </div>
          ) : (
            <div className="ed-detail-grid">
              <DetailItem label="CTC" value={unlockedPayroll.ctc ? `₹${unlockedPayroll.ctc.toLocaleString('en-IN')}` : 'N/A'} />
              <DetailItem label="Gross salary" value={unlockedPayroll.gross ? `₹${unlockedPayroll.gross.toLocaleString('en-IN')}` : 'N/A'} />
              <DetailItem label="PF" value={unlockedPayroll.pf ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="PT" value={unlockedPayroll.pt ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="ESIC" value={unlockedPayroll.esic ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="TDS" value={unlockedPayroll.tds ? 'Applicable' : 'Not applicable'} />
            </div>
          )}
        </DetailCard>
      ) : (
        <div className="ed-empty-tab">
          {isPending ? 'Payroll details will be available after approval.' : 'No payroll details available.'}
        </div>
      )}
    </>
  );

  const renderPayrollHistoryTab = () => {
    if (isPending) {
      return <div className="ed-empty-tab">Payroll history will be available after approval.</div>;
    }
    if (!hasPayrollDetails) {
      return <div className="ed-empty-tab">No payroll history available.</div>;
    }
    if (!unlockedPayroll) {
      return renderSensitiveGate('Payroll history', 'Payroll history is protected');
    }

    const history = unlockedPayroll.history || [];

    if (history.length === 0) {
      return <div className="ed-empty-tab">No payroll history available.</div>;
    }

    const sortedHistory = [...history].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return (
      <div className="ed-timeline" style={{ marginTop: '20px' }}>
        {sortedHistory.map((entry, index) => (
          <div key={index} className="ed-timeline-item" style={{ borderLeft: '2px solid var(--color-primary)', paddingLeft: '16px', position: 'relative', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', left: '-6px', top: '0', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: '500' }}>
              {new Date(entry.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} - <span style={{ textTransform: 'capitalize' }}>{entry.changeType || 'Updated'}</span>
            </div>
            <div className="ed-detail-grid" style={{ background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <DetailItem label="CTC" value={entry.ctc ? `₹${entry.ctc.toLocaleString('en-IN')}` : 'N/A'} />
              <DetailItem label="Gross salary" value={entry.gross ? `₹${entry.gross.toLocaleString('en-IN')}` : 'N/A'} />
              <DetailItem label="PF" value={entry.pf ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="PT" value={entry.pt ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="ESIC" value={entry.esic ? 'Applicable' : 'Not applicable'} />
              <DetailItem label="TDS" value={entry.tds ? 'Applicable' : 'Not applicable'} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalTab();
      case 'employee':
        return renderEmployeeTab();
      case 'payroll':
        return renderPayrollTab();
      case 'documents':
        return (
          <>
            <h2 className="ed-tab-section-title">Documents</h2>
            <div className="ed-empty-tab">
              <p style={{ marginBottom: '12px' }}>Generate and manage employee documents from the documents page.</p>
              <button type="button" className="btn btn-primary" onClick={() => navigate('/documents')}>
                Go to Documents
              </button>
            </div>
          </>
        );
      case 'payroll-history':
        return (
          <>
            <h2 className="ed-tab-section-title">Payroll history</h2>
            {renderPayrollHistoryTab()}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container ed-page">
      <div className="ed-header-row">
        <div>
          <p className="ed-breadcrumb">
            Employee <span>/</span> Employee Detail
          </p>
          <h1>{displayName}</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {user.emp_code ? `Employee code: ${user.emp_code}` : 'Profile in progress'}
          </p>
          <div style={{ marginTop: '12px', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              <span>Profile completion</span>
              <strong style={{ color: completionPercentage >= 100 ? '#1f8b4c' : completionPercentage >= 60 ? '#c08a00' : '#b42318' }}>
                {completionPercentage}%
              </strong>
            </div>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, completionPercentage))}%`,
                  height: '100%',
                  borderRadius: 'inherit',
                  background: completionPercentage >= 100
                    ? 'linear-gradient(90deg, #1f8b4c, rgba(15, 23, 42, 0.85))'
                    : completionPercentage >= 60
                      ? 'linear-gradient(90deg, #c08a00, rgba(15, 23, 42, 0.75))'
                      : 'linear-gradient(90deg, #b42318, rgba(15, 23, 42, 0.72))'
                }}
              />
            </div>
                {completionPercentage < 100 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '10px' }}
                    onClick={() => navigate(`/add-employee?edit=${id}`)}
                  >
                    Fill missing details
                  </button>
                )}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/employees')}
        >
          Back
        </button>
      </div>

      <div className="ed-tabs-wrap">
        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (editMode) cancelEdit();
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default EmployeeDetail;
