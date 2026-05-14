import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    personal: {
      fullName: '',
      gender: '',
      dob: '',
      mobile: '',
      bloodGroup: ''
    },
    family: {
      fatherName: '',
      motherName: '',
      married: false,
      spouseName: '',
      marriageDate: ''
    },
    address: {
      currentAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      permanentAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: '',
        relationship: '',
        mobile: ''
      },
      emergencyContact2: {
        name: '',
        relationship: '',
        mobile: ''
      }
    }
  });

  const handleChange = (section, field, value) => {
    if (section === 'root') {
      setFormData({ ...formData, [field]: value });
    } else if (section === 'address') {
      const [addressType, addressField] = field.split('.');
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressType]: {
            ...formData.address[addressType],
            [addressField]: value
          }
        }
      });
    } else if (section === 'emergency') {
      const [contactNum, contactField] = field.split('.');
      setFormData({
        ...formData,
        emergency: {
          ...formData.emergency,
          [contactNum]: {
            ...formData.emergency[contactNum],
            [contactField]: value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    }
  };

  const nextStep = () => {
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/waiting');
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors?.length) {
        setError(validationErrors.map((item) => item.msg).join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div>
      <h3>Step 1: Personal Information</h3>
      
      <div className="grid-2">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('root', 'email', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('root', 'password', e.target.value)}
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('root', 'confirmPassword', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={formData.personal.fullName}
            onChange={(e) => handleChange('personal', 'fullName', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Gender *</label>
          <select
            value={formData.personal.gender}
            onChange={(e) => handleChange('personal', 'gender', e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date of Birth *</label>
          <input
            type="date"
            value={formData.personal.dob}
            onChange={(e) => handleChange('personal', 'dob', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mobile Number *</label>
          <input
            type="tel"
            value={formData.personal.mobile}
            onChange={(e) => handleChange('personal', 'mobile', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Blood Group *</label>
          <select
            value={formData.personal.bloodGroup}
            onChange={(e) => handleChange('personal', 'bloodGroup', e.target.value)}
            required
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3>Step 2: Family Information</h3>
      
      <div className="grid-2">
        <div className="form-group">
          <label>Father's Name *</label>
          <input
            type="text"
            value={formData.family.fatherName}
            onChange={(e) => handleChange('family', 'fatherName', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mother's Name *</label>
          <input
            type="text"
            value={formData.family.motherName}
            onChange={(e) => handleChange('family', 'motherName', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.family.married}
              onChange={(e) => handleChange('family', 'married', e.target.checked)}
            />
            {' '}Married
          </label>
        </div>
      </div>

      {formData.family.married && (
        <div className="grid-2">
          <div className="form-group">
            <label>Spouse Name</label>
            <input
              type="text"
              value={formData.family.spouseName}
              onChange={(e) => handleChange('family', 'spouseName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Marriage Date</label>
            <input
              type="date"
              value={formData.family.marriageDate}
              onChange={(e) => handleChange('family', 'marriageDate', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3>Step 3: Address & Emergency Contacts</h3>
      
      <h4>Current Address</h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Street *</label>
          <input
            type="text"
            value={formData.address.currentAddress.street}
            onChange={(e) => handleChange('address', 'currentAddress.street', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={formData.address.currentAddress.city}
            onChange={(e) => handleChange('address', 'currentAddress.city', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            value={formData.address.currentAddress.state}
            onChange={(e) => handleChange('address', 'currentAddress.state', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Pincode *</label>
          <input
            type="text"
            value={formData.address.currentAddress.pincode}
            onChange={(e) => handleChange('address', 'currentAddress.pincode', e.target.value)}
            required
          />
        </div>
      </div>

      <h4>Permanent Address</h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Street *</label>
          <input
            type="text"
            value={formData.address.permanentAddress.street}
            onChange={(e) => handleChange('address', 'permanentAddress.street', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={formData.address.permanentAddress.city}
            onChange={(e) => handleChange('address', 'permanentAddress.city', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>State *</label>
          <input
            type="text"
            value={formData.address.permanentAddress.state}
            onChange={(e) => handleChange('address', 'permanentAddress.state', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Pincode *</label>
          <input
            type="text"
            value={formData.address.permanentAddress.pincode}
            onChange={(e) => handleChange('address', 'permanentAddress.pincode', e.target.value)}
            required
          />
        </div>
      </div>

      <h4>Emergency Contact 1 *</h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={formData.emergency.emergencyContact1.name}
            onChange={(e) => handleChange('emergency', 'emergencyContact1.name', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Relationship *</label>
          <input
            type="text"
            value={formData.emergency.emergencyContact1.relationship}
            onChange={(e) => handleChange('emergency', 'emergencyContact1.relationship', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Mobile *</label>
          <input
            type="tel"
            value={formData.emergency.emergencyContact1.mobile}
            onChange={(e) => handleChange('emergency', 'emergencyContact1.mobile', e.target.value)}
            required
          />
        </div>
      </div>

      <h4>Emergency Contact 2 (Optional)</h4>
      <div className="grid-2">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.emergency.emergencyContact2.name}
            onChange={(e) => handleChange('emergency', 'emergencyContact2.name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Relationship</label>
          <input
            type="text"
            value={formData.emergency.emergencyContact2.relationship}
            onChange={(e) => handleChange('emergency', 'emergencyContact2.relationship', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mobile</label>
          <input
            type="tel"
            value={formData.emergency.emergencyContact2.mobile}
            onChange={(e) => handleChange('emergency', 'emergencyContact2.mobile', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3>Step 4: Review & Submit</h3>
      
      <div className="card">
        <h4>Personal Information</h4>
        <p><strong>Name:</strong> {formData.personal.fullName}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Gender:</strong> {formData.personal.gender}</p>
        <p><strong>DOB:</strong> {formData.personal.dob}</p>
        <p><strong>Mobile:</strong> {formData.personal.mobile}</p>
        <p><strong>Blood Group:</strong> {formData.personal.bloodGroup}</p>
      </div>

      <div className="card">
        <h4>Family Information</h4>
        <p><strong>Father:</strong> {formData.family.fatherName}</p>
        <p><strong>Mother:</strong> {formData.family.motherName}</p>
        <p><strong>Married:</strong> {formData.family.married ? 'Yes' : 'No'}</p>
        {formData.family.married && (
          <>
            <p><strong>Spouse:</strong> {formData.family.spouseName}</p>
            <p><strong>Marriage Date:</strong> {formData.family.marriageDate}</p>
          </>
        )}
      </div>

      <div className="card">
        <h4>Emergency Contact</h4>
        <p><strong>Name:</strong> {formData.emergency.emergencyContact1.name}</p>
        <p><strong>Relationship:</strong> {formData.emergency.emergencyContact1.relationship}</p>
        <p><strong>Mobile:</strong> {formData.emergency.emergencyContact1.mobile}</p>
      </div>
    </div>
  );

  return (
    <div className="wizard-container">
      <div className="card">
        <h2>Employee Registration</h2>

        {/* Wizard Steps */}
        <div className="wizard-steps">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step} 
              className={`wizard-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <div className="wizard-step-number">{step}</div>
              <div className="wizard-step-label">
                {step === 1 && 'Personal'}
                {step === 2 && 'Family'}
                {step === 3 && 'Address & Emergency'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="wizard-buttons">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Previous
              </button>
            )}
            
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
