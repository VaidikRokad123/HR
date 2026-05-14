import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './BulkUploadModal.css';

const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [acceptedEmployees, setAcceptedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setCurrentReviewIndex(0);
      setAcceptedEmployees([]);
      setError('');
      setActiveTab('upload');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
      setCurrentReviewIndex(0);
      setAcceptedEmployees([]);
      setError('');
      setActiveTab('upload');
    }
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleParseExcel = () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const personalData = workbook.Sheets['Personal']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Personal'])
          : [];
        const professionalData = workbook.Sheets['Professional']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Professional'])
          : [];
        const familyData = workbook.Sheets['Family']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Family'])
          : [];
        const addressData = workbook.Sheets['Address']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Address'])
          : [];
        const bankData = workbook.Sheets['Bank']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Bank'])
          : [];
        const emergencyData = workbook.Sheets['Emergency']
          ? XLSX.utils.sheet_to_json(workbook.Sheets['Emergency'])
          : [];

        let formattedData = [];

        if (
          personalData.length === 0 &&
          workbook.SheetNames.length > 0 &&
          !workbook.Sheets['Professional']
        ) {
          const firstSheetName = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

          formattedData = rawData.map((row) => ({
            user: { email: row.Email || row.PersonalEmail || row.WorkEmail || '' },
            personal: {
              fullName: row.FullName || row.Name || '',
              gender: row.Gender || '',
              dob: row.DOB || '',
              mobile: row.Mobile || row.Phone || '',
              personalEmail: row.PersonalEmail || row.Email || '',
              bloodGroup: row.BloodGroup || '',
            },
            professional: {
              department: row.Department || '',
              jobTitle: row.JobTitle || '',
              dateJoined: row.DateJoined || '',
              workEmail: row.WorkEmail || '',
            },
          }));
        } else {
          const employeesMap = new Map();

          const getOrCreateEmp = (key) => {
            if (!employeesMap.has(key)) {
              employeesMap.set(key, {
                emp_code: '',
                user: { email: '' },
                personal: {
                  fullName: '',
                  gender: '',
                  dob: '',
                  mobile: '',
                  personalEmail: '',
                  bloodGroup: '',
                },
                professional: {
                  department: '',
                  jobTitle: '',
                  dateJoined: '',
                  workEmail: '',
                  reportingManager: '',
                  attendanceBiometricId: '',
                  linkedinUrl: '',
                  inProbation: false,
                },
                family: {
                  fatherName: '',
                  motherName: '',
                  maritalStatus: 'Single',
                  spouseName: '',
                  marriageDate: '',
                },
                address: {
                  currentAddress: {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                  },
                  permanentAddress: {
                    street: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India',
                  },
                },
                bank: {
                  companyOpensBank: false,
                  panNumber: '',
                  aadharNumber: '',
                  bankName: '',
                  branch: '',
                  personalAccountNumber: '',
                  personalIfsc: '',
                  salaryAccountNumber: '',
                  salaryIfsc: '',
                },
                emergency: {
                  emergencyContact1: { name: '', relationship: '', mobile: '' },
                  emergencyContact2: { name: '', relationship: '', mobile: '' },
                },
              });
            }
            return employeesMap.get(key);
          };

          const processDate = (dateVal) => {
            if (!dateVal) return '';
            if (typeof dateVal === 'number') {
              const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
              return date.toISOString().split('T')[0];
            }
            try {
              return new Date(dateVal).toISOString().split('T')[0];
            } catch (err) {
              return dateVal;
            }
          };

          personalData.forEach((row, idx) => {
            const key = row.EmpCode || row.Email || row.PersonalEmail || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            if (!emp.user.email) emp.user.email = row.Email || row.PersonalEmail || row.WorkEmail || '';
            emp.personal = {
              ...emp.personal,
              fullName: row.FullName || row.Name || '',
              gender: row.Gender || '',
              dob: processDate(row.DOB),
              age: row.Age || '',
              mobile: row.Mobile || row.Phone || '',
              personalEmail: row.PersonalEmail || row.Email || '',
              bloodGroup: row.BloodGroup || '',
            };
          });

          professionalData.forEach((row, idx) => {
            const key = row.EmpCode || row.Email || row.WorkEmail || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            if (!emp.user.email) emp.user.email = row.WorkEmail || row.Email || '';
            emp.professional = {
              ...emp.professional,
              department: row.Department || '',
              jobTitle: row.JobTitle || '',
              dateJoined: processDate(row.DateJoined),
              reportingManager: row.ReportingManager || '',
              workEmail: row.WorkEmail || '',
              attendanceBiometricId: row.BiometricId || '',
              linkedinUrl: row.LinkedIn || '',
              inProbation: row.Probation === 'Yes',
            };
          });

          familyData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.family = {
              ...emp.family,
              fatherName: row.FatherName || '',
              motherName: row.MotherName || '',
              maritalStatus: row['Marital Status'] || row.MaritalStatus || 'Single',
              spouseName: row.SpouseName || '',
              marriageDate: processDate(row.MarriageDate),
            };
          });

          addressData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.address = {
              ...emp.address,
              currentAddress: {
                street: row.CurrentStreet || '',
                city: row.CurrentCity || '',
                state: row.CurrentState || '',
                pincode: row.CurrentPincode || '',
                country: row.CurrentCountry || 'India',
              },
              permanentAddress: {
                street: row.PermStreet || '',
                city: row.PermCity || '',
                state: row.PermState || '',
                pincode: row.PermPincode || '',
                country: row.PermCountry || 'India',
              },
            };
          });

          bankData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.bank = {
              ...emp.bank,
              companyOpensBank: row.CompanyOpensBank === 'Yes',
              panNumber: row.PANNumber || '',
              aadharNumber: row.AadharNumber || '',
              bankName: row.BankName || '',
              branch: row.Branch || '',
              personalAccountNumber: row.PersonalAccountNumber || '',
              personalIfsc: row.PersonalIFSC || '',
              salaryAccountNumber: row.SalaryAccountNumber || '',
              salaryIfsc: row.SalaryIFSC || '',
            };
          });

          emergencyData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.emergency = {
              ...emp.emergency,
              emergencyContact1: {
                name: row.PrimaryContactName || '',
                relationship: row.PrimaryContactRelationship || '',
                mobile: row.PrimaryContactMobile || '',
              },
              emergencyContact2: {
                name: row.SecondaryContactName || '',
                relationship: row.SecondaryContactRelationship || '',
                mobile: row.SecondaryContactMobile || '',
              },
            };
          });

          formattedData = Array.from(employeesMap.values());
        }

        setParsedData(formattedData);
        setLoading(false);
        if (formattedData.length === 0) {
          setError('No employee rows found. Check sheet names and columns.');
          setActiveTab('upload');
        } else {
          setCurrentReviewIndex(0);
          setAcceptedEmployees([]);
          setActiveTab('review');
        }
      } catch (err) {
        setError('Error parsing Excel file.');
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFieldChange = (index, category, field, value) => {
    const newData = [...parsedData];
    newData[index][category][field] = value;
    setParsedData(newData);
  };

  const handleEmailChange = (index, value) => {
    const newData = [...parsedData];
    newData[index].user.email = value;
    newData[index].personal.personalEmail = value;
    setParsedData(newData);
  };

  const handleSubmit = async () => {
    if (acceptedEmployees.length === 0) {
      alert("No employees selected for upload.");
      onClose();
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post('/hr/bulk-upload', { employees: acceptedEmployees });

      if (response.data.errorCount > 0) {
        alert(`Upload finished, but ${response.data.errorCount} row(s) failed to save.\n\nThis usually happens when an employee is missing required Database fields (like Full Name, Gender, DOB, Mobile, or Blood Group). Check the Node console for exact details.`);
      } else {
        alert('Bulk upload completed successfully!');
      }
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  const goUploadTab = () => {
    setActiveTab('upload');
  };

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content bulk-upload-modal"
        role="dialog"
        aria-labelledby="bulk-upload-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bulk-modal-rangoli" aria-hidden="true" />
        <div className="modal-header bulk-modal-header">
          <div>
            <h2 id="bulk-upload-title">Bulk upload employees</h2>
            <p className="bulk-modal-sub">Excel (.xlsx / .xls) · multi-sheet or single flat sheet</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="bulk-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upload'}
            className={`bulk-tab${activeTab === 'upload' ? ' active' : ''}`}
            onClick={goUploadTab}
          >
            <span className="bulk-tab-num">1</span>
            <span className="bulk-tab-label">Upload Excel</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'review'}
            className={`bulk-tab bulk-tab--green${activeTab === 'review' ? ' active' : ''}`}
            disabled={parsedData.length === 0}
            onClick={() => parsedData.length > 0 && setActiveTab('review')}
          >
            <span className="bulk-tab-num">2</span>
            <span className="bulk-tab-label">Review &amp; confirm</span>
          </button>
        </div>

        <div className="modal-body bulk-modal-body">
          {error && <div className="alert alert-error bulk-alert">{error}</div>}

          {activeTab === 'upload' && (
            <div className="bulk-upload-panel">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="bulk-file-input-hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                className="bulk-drop-zone"
                onClick={handleDropZoneClick}
                disabled={loading}
              >
                <div className="bulk-drop-icon" aria-hidden="true">
                  <i className="ti ti-file-spreadsheet" />
                </div>
                <p className="bulk-drop-title">
                  {file ? file.name : 'Drop a file here or click to browse'}
                </p>
                <p className="bulk-drop-hint">Maximum practical size depends on your network; keep under a few MB.</p>
              </button>

              <div className="bulk-sheet-hints">
                <span className="bulk-hint-label">Multi-sheet template</span>
                <p>
                  Sheets: <span className="hl-orange">Personal</span>,{' '}
                  <span className="hl-green">Professional</span>,{' '}
                  <span className="hl-orange">Family</span>, <span className="hl-green">Address</span>,{' '}
                  <span className="hl-orange">Bank</span>, <span className="hl-green">Emergency</span> — keyed by{' '}
                  <strong>EmpCode</strong> or email.
                </p>
                <p className="bulk-hint-alt">
                  Or one sheet with columns such as Email, FullName, Department… (export from this app matches the
                  template).
                </p>
              </div>

              <div className="bulk-upload-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleParseExcel}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <i className="ti ti-loader bulk-spin" aria-hidden="true" /> Parsing…
                    </>
                  ) : (
                    <>
                      <i className="ti ti-table-import" aria-hidden="true" style={{ marginRight: 8 }} />
                      Parse Excel
                    </>
                  )}
                </button>
                {file && (
                  <button type="button" className="btn btn-secondary" onClick={handleDropZoneClick}>
                    Change file
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'review' && parsedData.length > 0 && currentReviewIndex < parsedData.length && (() => {
            const emp = parsedData[currentReviewIndex];
            return (
            <div className="bulk-review-panel">
              <div className="bulk-review-banner">
                <i className="ti ti-user" aria-hidden="true" />
                <div>
                  <p className="bulk-review-count">
                    Reviewing Employee <span className="bulk-count-n">{currentReviewIndex + 1}</span> of {parsedData.length}
                  </p>
                  <p className="bulk-review-sub">Review details. Accept to include, or Reject to skip.</p>
                </div>
              </div>

              <div className="employee-review-details" style={{ maxHeight: '50vh', overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="card" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--saffron, orange)', borderBottom: '2px solid var(--saffron, orange)', paddingBottom: '5px', marginBottom: '15px' }}>Personal Details</h4>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email <span className="req">*</span></label>
                      <input type="email" value={emp.user.email} onChange={(e) => handleEmailChange(currentReviewIndex, e.target.value)} className={`bulk-cell-input${!emp.user.email ? ' input-error' : ''}`} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Emp Code</label>
                      <input type="text" value={emp.emp_code || ''} onChange={(e) => { const newData = [...parsedData]; newData[currentReviewIndex].emp_code = e.target.value; setParsedData(newData); }} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Full Name</label>
                      <input type="text" value={emp.personal.fullName} onChange={(e) => handleFieldChange(currentReviewIndex, 'personal', 'fullName', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Mobile</label>
                      <input type="text" value={emp.personal.mobile} onChange={(e) => handleFieldChange(currentReviewIndex, 'personal', 'mobile', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--green, green)', borderBottom: '2px solid var(--green, green)', paddingBottom: '5px', marginBottom: '15px' }}>Professional Details</h4>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Department</label>
                      <input type="text" value={emp.professional.department} onChange={(e) => handleFieldChange(currentReviewIndex, 'professional', 'department', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Job Title</label>
                      <input type="text" value={emp.professional.jobTitle} onChange={(e) => handleFieldChange(currentReviewIndex, 'professional', 'jobTitle', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date Joined</label>
                      <input type="date" value={emp.professional.dateJoined} onChange={(e) => handleFieldChange(currentReviewIndex, 'professional', 'dateJoined', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ color: 'var(--saffron, orange)', borderBottom: '2px solid var(--saffron, orange)', paddingBottom: '5px', marginBottom: '15px' }}>Bank Details</h4>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Bank Name</label>
                      <input type="text" value={emp.bank.bankName} onChange={(e) => handleFieldChange(currentReviewIndex, 'bank', 'bankName', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Personal Account No</label>
                      <input type="text" value={emp.bank.personalAccountNumber} onChange={(e) => handleFieldChange(currentReviewIndex, 'bank', 'personalAccountNumber', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>IFSC</label>
                      <input type="text" value={emp.bank.personalIfsc} onChange={(e) => handleFieldChange(currentReviewIndex, 'bank', 'personalIfsc', e.target.value)} className="bulk-cell-input" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {activeTab === 'review' && parsedData.length > 0 && currentReviewIndex >= parsedData.length && (
            <div className="bulk-review-panel">
               <div className="bulk-review-banner">
                <i className="ti ti-check" aria-hidden="true" />
                <div>
                  <p className="bulk-review-count">
                    Review Complete
                  </p>
                  <p className="bulk-review-sub">You have accepted {acceptedEmployees.length} employees out of {parsedData.length}.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer bulk-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {activeTab === 'review' && parsedData.length > 0 && currentReviewIndex < parsedData.length && (
            <>
              <button type="button" className="btn btn-danger" onClick={() => setCurrentReviewIndex(currentReviewIndex + 1)}>
                Reject & Skip
              </button>
              <button type="button" className="btn btn-success" onClick={() => {
                const emp = parsedData[currentReviewIndex];
                if (!emp.user.email) {
                  alert("Email is mandatory to accept this employee.");
                  return;
                }
                setAcceptedEmployees([...acceptedEmployees, emp]);
                setCurrentReviewIndex(currentReviewIndex + 1);
              }}>
                Accept & Next
              </button>
            </>
          )}
          {activeTab === 'review' && parsedData.length > 0 && currentReviewIndex >= parsedData.length && (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setCurrentReviewIndex(0);
                setAcceptedEmployees([]);
              }}>
                Review Again
              </button>
              <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={loading || acceptedEmployees.length === 0}>
                {loading ? 'Uploading…' : `Confirm & Upload ${acceptedEmployees.length} Employees`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
