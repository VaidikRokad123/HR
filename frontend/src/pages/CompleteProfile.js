import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    companyOpensBank: false,
    panNumber: '',
    aadharNumber: '',
    permissionToUsePanAadhar: false,
    bankName: '',
    branch: '',
    personalAccountNumber: '',
    personalIfsc: '',
    linkedinUrl: '',
    nameAsPerAadhaar: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  // Check if profile is already complete
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const response = await axios.get('/employee/waiting-status');
        const { status, profileComplete } = response.data;

        // If profile is already complete, redirect to dashboard
        if (profileComplete) {
          navigate('/employee/dashboard', { replace: true });
          return;
        }

        // If not approved yet, redirect to waiting page
        if (status !== 'approved') {
          navigate('/waiting', { replace: true });
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error('Profile status check error:', err);
        setError('Failed to verify profile status');
        setChecking(false);
      }
    };

    checkProfileStatus();
  }, [navigate]);

  const validateLinkedInUrl = (url) => {
    if (!url) return 'LinkedIn URL is required';
    
    // Check if it's a valid URL
    try {
      const urlObj = new URL(url);
      
      // Check if it's a LinkedIn domain
      if (!urlObj.hostname.includes('linkedin.com')) {
        return 'Please provide a valid LinkedIn URL (e.g., https://www.linkedin.com/in/yourprofile)';
      }
      
      // Check if it's a profile URL
      if (!urlObj.pathname.includes('/in/')) {
        return 'Please provide a LinkedIn profile URL (should contain /in/)';
      }
      
      return null;
    } catch (e) {
      return 'Please provide a valid URL starting with https://';
    }
  };

  const validateIFSC = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifsc) return 'IFSC code is required';
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return 'Invalid IFSC code format (e.g., SBIN0001234)';
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (formData.companyOpensBank) {
      if (!formData.panNumber.trim()) errors.panNumber = 'PAN Number is required';
      if (!formData.aadharNumber.trim()) errors.aadharNumber = 'Aadhar Number is required';
      if (!formData.permissionToUsePanAadhar) errors.permissionToUsePanAadhar = 'You must grant permission';
    } else {
      if (!formData.bankName.trim()) errors.bankName = 'Bank name is required';
      if (!formData.branch.trim()) errors.branch = 'Branch is required';
      if (!formData.personalAccountNumber.trim()) errors.personalAccountNumber = 'Account number is required';
      
      const ifscError = validateIFSC(formData.personalIfsc);
      if (ifscError) errors.personalIfsc = ifscError;
    }
    
    const linkedinError = validateLinkedInUrl(formData.linkedinUrl);
    if (linkedinError) errors.linkedinUrl = linkedinError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }
    
    setLoading(true);

    try {
      await axios.put('/employee/complete-profile', {
        ...formData,
        personalIfsc: formData.personalIfsc.toUpperCase()
      });
      
      // Refresh user data to update profileComplete status
      await fetchUser();
      
      // Navigate to dashboard
      navigate('/employee/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking profile status
  if (checking) {
    return (
      <div className="container">
        <div className="loading">Checking profile status...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2>Complete Your Profile</h2>
        <p style={{ color: '#000000', marginBottom: '24px' }}>
          🎉 Congratulations! Your profile has been approved by HR. Please complete the following mandatory information to access your dashboard.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <h3>Bank Details</h3>
          <p style={{ color: '#000000', fontSize: '13px', marginBottom: '16px' }}>
            These details will be used for salary processing and other financial transactions.
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)' }}>
              <input
                type="checkbox"
                name="companyOpensBank"
                checked={formData.companyOpensBank}
                onChange={handleChange}
                style={{ width: 'auto' }}
              />
              Company open bank account for me
            </label>
          </div>
          
          <div className="grid-2">
            {formData.companyOpensBank ? (
              <>
                <div className="form-group">
                  <label>PAN Number *</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                    placeholder="e.g., ABCDE1234F"
                    maxLength="10"
                  />
                  {validationErrors.panNumber && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.panNumber}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Aadhar Number *</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    placeholder="e.g., 123456789012"
                    maxLength="12"
                  />
                  {validationErrors.aadharNumber && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.aadharNumber}</small>
                  )}
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--ink)', textTransform: 'none', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      name="permissionToUsePanAadhar"
                      checked={formData.permissionToUsePanAadhar}
                      onChange={handleChange}
                      style={{ width: 'auto' }}
                    />
                    I grant permission to use my PAN and Aadhar for opening a bank account
                  </label>
                  {validationErrors.permissionToUsePanAadhar && (
                    <small style={{ color: '#d84a4a', display: 'block', marginTop: '4px' }}>{validationErrors.permissionToUsePanAadhar}</small>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g., State Bank of India"
                  />
                  {validationErrors.bankName && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.bankName}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    placeholder="e.g., Mumbai Main Branch"
                  />
                  {validationErrors.branch && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.branch}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Personal Account Number *</label>
                  <input
                    type="text"
                    name="personalAccountNumber"
                    value={formData.personalAccountNumber}
                    onChange={handleChange}
                    placeholder="Enter your account number"
                  />
                  {validationErrors.personalAccountNumber && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.personalAccountNumber}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Personal IFSC Code *</label>
                  <input
                    type="text"
                    name="personalIfsc"
                    value={formData.personalIfsc}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                    placeholder="e.g., SBIN0001234"
                    maxLength="11"
                  />
                  {validationErrors.personalIfsc && (
                    <small style={{ color: '#d84a4a' }}>{validationErrors.personalIfsc}</small>
                  )}
                  <small style={{ color: '#000000', display: 'block', marginTop: '4px' }}>
                    11-character code (e.g., SBIN0001234)
                  </small>
                </div>
              </>
            )}
          </div>

          <h3 style={{ marginTop: '32px' }}>Professional Details</h3>
          <p style={{ color: '#000000', fontSize: '13px', marginBottom: '16px' }}>
            Your LinkedIn profile helps us verify your professional background and connect with you.
          </p>
          
          <div className="grid-2">
            <div className="form-group">
              <label>LinkedIn Profile URL * (Mandatory)</label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                required
                placeholder="https://www.linkedin.com/in/yourprofile"
              />
              {validationErrors.linkedinUrl && (
                <small style={{ color: '#d84a4a' }}>{validationErrors.linkedinUrl}</small>
              )}
              <small style={{ color: '#000000', display: 'block', marginTop: '4px' }}>
                Your complete LinkedIn profile URL is mandatory
              </small>
            </div>

            <div className="form-group">
              <label>Name as per Aadhaar (Optional)</label>
              <input
                type="text"
                name="nameAsPerAadhaar"
                value={formData.nameAsPerAadhaar}
                onChange={handleChange}
                placeholder="Enter name exactly as on Aadhaar"
              />
              <small style={{ color: '#000000', display: 'block', marginTop: '4px' }}>
                This helps with identity verification
              </small>
            </div>
          </div>

          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #cccccc' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#000000' }}>
              ⚠️ <strong>Important:</strong> Once submitted, you cannot edit these details yourself. 
              Any changes will require HR approval. Please ensure all information is accurate.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ marginTop: '24px', width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile & Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
