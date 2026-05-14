import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { state_arr, s_a } from '../utils/locationData';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    gender: '',
    dob: '',
    mobile: '',
    bloodGroup: '',

    fatherName: '',
    motherName: '',
    maritalStatus: 'Single',
    spouseName: '',
    marriageDate: '',

    currentStreet: '',
    currentState: '',
    currentCity: '',
    currentPincode: '',
    sameAsCurrent: false,
    permanentStreet: '',
    permanentState: '',
    permanentCity: '',
    permanentPincode: '',

    emergencyName1: '',
    emergencyRelationship1: '',
    emergencyMobile1: '',
    emergencyName2: '',
    emergencyRelationship2: '',
    emergencyMobile2: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentCityList, setCurrentCityList] = useState([]);
  const [permanentCityList, setPermanentCityList] = useState([]);

  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      if (user.status === 'pending_hr') {
        navigate('/waiting', { replace: true });
      } else if (user.status === 'approved' && !user.profileComplete) {
        navigate('/employee/complete-profile', { replace: true });
      } else {
        navigate(user.role === 'hr' ? '/hr/pending' : '/employee/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];

  // Blood Group options
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Marital Status options
  const maritalStatusOptions = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];

  // Relationship options
  const relationshipOptions = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Friend', 'Other'];

  // State options (from locationData)
  const stateOptions = state_arr;

  // Function to get city options based on state
  const getCityOptions = (stateName) => {
    const stateIndex = state_arr.indexOf(stateName) + 1;
    if (stateIndex > 0 && s_a[stateIndex]) {
      return s_a[stateIndex].split('|').map(c => c.trim()).filter(c => c);
    }
    return [];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleStateChange = (e) => {
    const stateName = e.target.value;
    setFormData({ ...formData, currentState: stateName, currentCity: '' });
    setCurrentCityList(getCityOptions(stateName));
  };

  const handlePermanentStateChange = (e) => {
    const stateName = e.target.value;
    setFormData({ ...formData, permanentState: stateName, permanentCity: '' });
    setPermanentCityList(getCityOptions(stateName));
  };

  const handleSameAsCurrentChange = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      sameAsCurrent: checked,
      ...(checked
        ? {
            permanentStreet: prev.currentStreet,
            permanentState: prev.currentState,
            permanentCity: prev.currentCity,
            permanentPincode: prev.currentPincode,
          }
        : {}),
    }));
  };

  const validate = () => {
    const errs = {};
    // Step 1
    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";
    if (!formData.password) errs.password = "Password is required";
    if (formData.password && formData.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (!formData.fullName) errs.fullName = "Full Name is required";
    if (!formData.gender) errs.gender = "Gender is required";
    if (!formData.dob) errs.dob = "Date of Birth is required";
    if (!formData.mobile) errs.mobile = "Mobile Number is required";
    if (!formData.bloodGroup) errs.bloodGroup = "Blood Group is required";

    // Step 2
    if (!formData.fatherName) errs.fatherName = "Father's Name is required";
    if (!formData.motherName) errs.motherName = "Mother's Name is required";
    if (!formData.maritalStatus) errs.maritalStatus = "Marital Status is required";

    // Step 3
    if (!formData.currentStreet) errs.currentStreet = "Current Street is required";
    if (!formData.currentState) errs.currentState = "Current State is required";
    if (!formData.currentCity) errs.currentCity = "Current City is required";
    if (!formData.currentPincode) errs.currentPincode = "Current Pincode is required";

    if (!formData.sameAsCurrent) {
      if (!formData.permanentStreet) errs.permanentStreet = "Permanent Street is required";
      if (!formData.permanentState) errs.permanentState = "Permanent State is required";
      if (!formData.permanentCity) errs.permanentCity = "Permanent City is required";
      if (!formData.permanentPincode) errs.permanentPincode = "Permanent Pincode is required";
    }

    if (!formData.emergencyName1) errs.emergencyName1 = "Emergency Contact 1 Name is required";
    if (!formData.emergencyRelationship1) errs.emergencyRelationship1 = "Emergency Contact 1 Relationship is required";
    if (!formData.emergencyMobile1) errs.emergencyMobile1 = "Emergency Contact 1 Mobile is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 3) {
      validate(); // trigger validation and show errors on step 4
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        personal: {
          fullName: formData.fullName,
          gender: formData.gender,
          dob: formData.dob,
          mobile: formData.mobile,
          bloodGroup: formData.bloodGroup,
        },
        family: {
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          maritalStatus: formData.maritalStatus,
          spouseName: formData.spouseName,
          marriageDate: formData.marriageDate,
        },
        address: {
          currentAddress: {
            street: formData.currentStreet,
            city: formData.currentCity,
            state: formData.currentState,
            pincode: formData.currentPincode,
            country: 'India',
          },
          permanentAddress: {
            street: formData.sameAsCurrent ? formData.currentStreet : formData.permanentStreet,
            city: formData.sameAsCurrent ? formData.currentCity : formData.permanentCity,
            state: formData.sameAsCurrent ? formData.currentState : formData.permanentState,
            pincode: formData.sameAsCurrent ? formData.currentPincode : formData.permanentPincode,
            country: 'India',
          },
        },
        emergency: {
          emergencyContact1: {
            name: formData.emergencyName1,
            relationship: formData.emergencyRelationship1,
            mobile: formData.emergencyMobile1,
          },
          ...(formData.emergencyName2
            ? {
                emergencyContact2: {
                  name: formData.emergencyName2,
                  relationship: formData.emergencyRelationship2,
                  mobile: formData.emergencyMobile2,
                },
              }
            : {}),
        },
      };

      await axios.post('/auth/register', payload);
      
      try {
        await login(formData.email, formData.password);
        navigate('/waiting', { replace: true });
      } catch (loginErr) {
        navigate('/login');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to register employee');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Employee Registration</h2>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          {/* Background Line */}
          <div style={{ position: 'absolute', top: '15px', left: '12.5%', right: '12.5%', height: '3px', background: 'var(--border, #ccc)', zIndex: 1 }}></div>

          {/* Progress Line */}
          <div style={{ position: 'absolute', top: '15px', left: '12.5%', height: '3px', background: 'var(--saffron)', zIndex: 2, width: `${((step - 1) / 3) * 75}%`, transition: 'width 0.3s ease' }}></div>

          {/* Steps */}
          {[
            { num: 1, label: 'Personal' },
            { num: 2, label: 'Family' },
            { num: 3, label: 'Address & Emergency' },
            { num: 4, label: 'Review' }
          ].map((s) => (
            <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '25%' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.num ? 'var(--saffron)' : '#fff',
                color: step >= s.num ? '#fff' : '#666',
                fontWeight: 'bold', marginBottom: '8px',
                border: `2px solid ${step >= s.num ? 'var(--saffron)' : 'var(--border, #ccc)'}`,
                transition: 'all 0.3s ease'
              }}>
                {step > s.num ? '✓' : s.num}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: step >= s.num ? '600' : 'normal',
                color: step >= s.num ? 'var(--saffron)' : '#666',
                textAlign: 'center'
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <form>
          {step === 1 && (
            <div>
              <h3>Step 1: Personal Information</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Blood Group *</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required>
                    <option value="">Select Blood Group</option>
                    {bloodGroupOptions.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-primary" onClick={handleNext}>Next</button>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--saffron)' }}>Login</Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Step 2: Family Information</h3>
              <div className="grid-2">
                <div className="form-group">
                  <label>Father's Name *</label>
                  <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Mother's Name *</label>
                  <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Marital Status *</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required>
                    {maritalStatusOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {formData.maritalStatus === 'Married' && (
                  <>
                    <div className="form-group">
                      <label>Spouse Name</label>
                      <input type="text" name="spouseName" value={formData.spouseName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Marriage Date</label>
                      <input type="date" name="marriageDate" value={formData.marriageDate} onChange={handleChange} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrev}>Previous</button>
                <button type="button" className="btn btn-primary" onClick={handleNext}>Next</button>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--saffron)' }}>Login</Link>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Step 3: Address & Emergency Contacts</h3>
              
              <h4 style={{ color: 'var(--saffron)', marginTop: '20px' }}>Current Address</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>Street *</label>
                  <input type="text" name="currentStreet" value={formData.currentStreet} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <select name="currentState" value={formData.currentState} onChange={handleStateChange} required>
                    <option value="">Search State...</option>
                    {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <select name="currentCity" value={formData.currentCity} onChange={handleChange} required disabled={!formData.currentState}>
                    <option value="">Search City...</option>
                    {currentCityList.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input type="text" name="currentPincode" value={formData.currentPincode} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name="sameAsCurrent" checked={formData.sameAsCurrent} onChange={handleSameAsCurrentChange} style={{ width: 'auto' }} />
                  Permanent Address is the same as Current Address
                </label>
              </div>

              {!formData.sameAsCurrent && (
                <>
                  <h4 style={{ color: 'var(--saffron)', marginTop: '20px' }}>Permanent Address</h4>
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Street *</label>
                      <input type="text" name="permanentStreet" value={formData.permanentStreet} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <select name="permanentState" value={formData.permanentState} onChange={handlePermanentStateChange} required>
                        <option value="">Search State...</option>
                        {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <select name="permanentCity" value={formData.permanentCity} onChange={handleChange} required disabled={!formData.permanentState}>
                        <option value="">Search City...</option>
                        {permanentCityList.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input type="text" name="permanentPincode" value={formData.permanentPincode} onChange={handleChange} required />
                    </div>
                  </div>
                </>
              )}

              <h4 style={{ color: 'var(--saffron)', marginTop: '20px' }}>Emergency Contact 1 *</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" name="emergencyName1" value={formData.emergencyName1} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Relationship *</label>
                  <select name="emergencyRelationship1" value={formData.emergencyRelationship1} onChange={handleChange} required>
                    <option value="">Select Relationship</option>
                    {relationshipOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile *</label>
                  <input type="text" name="emergencyMobile1" value={formData.emergencyMobile1} onChange={handleChange} required />
                </div>
              </div>

              <h4 style={{ color: 'var(--saffron)', marginTop: '20px' }}>Emergency Contact 2 (Optional)</h4>
              <div className="grid-2">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="emergencyName2" value={formData.emergencyName2} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Relationship</label>
                  <select name="emergencyRelationship2" value={formData.emergencyRelationship2} onChange={handleChange}>
                    <option value="">Select Relationship</option>
                    {relationshipOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input type="text" name="emergencyMobile2" value={formData.emergencyMobile2} onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrev}>Previous</button>
                <button type="button" className="btn btn-primary" onClick={handleNext}>Next (Review)</button>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--saffron)' }}>Login</Link>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3>Step 4: Review & Submit</h3>
              
              {Object.keys(errors).length > 0 ? (
                <div className="alert alert-error" style={{ marginBottom: '20px', padding: '15px' }}>
                  <strong style={{ display: 'block', marginBottom: '10px' }}>Please fix the following validation errors:</strong>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {Object.values(errors).map((err, idx) => (
                      <li key={idx} style={{ marginBottom: '5px' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                  All required fields are completed. Please review your details and submit.
                </div>
              )}

              {submitError && <div className="alert alert-error">{submitError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px', background: 'var(--sand-dark)', padding: '20px', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ color: 'var(--saffron)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', marginBottom: '10px' }}>Personal</h4>
                  <p style={{ marginBottom: '5px' }}><strong>Name:</strong> {formData.fullName}</p>
                  <p style={{ marginBottom: '5px' }}><strong>Email:</strong> {formData.email}</p>
                  <p style={{ marginBottom: '5px' }}><strong>Mobile:</strong> {formData.mobile}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--saffron)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', marginBottom: '10px' }}>Family</h4>
                  <p style={{ marginBottom: '5px' }}><strong>Father:</strong> {formData.fatherName}</p>
                  <p style={{ marginBottom: '5px' }}><strong>Mother:</strong> {formData.motherName}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--saffron)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', marginBottom: '10px' }}>Address</h4>
                  <p style={{ marginBottom: '5px' }}><strong>Current City:</strong> {formData.currentCity}</p>
                  <p style={{ marginBottom: '5px' }}><strong>Current State:</strong> {formData.currentState}</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--saffron)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', marginBottom: '10px' }}>Emergency</h4>
                  <p style={{ marginBottom: '5px' }}><strong>Contact 1:</strong> {formData.emergencyName1} ({formData.emergencyRelationship1})</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrev}>Previous (Edit)</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSubmit} 
                  disabled={loading || Object.keys(errors).length > 0}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Signup;
