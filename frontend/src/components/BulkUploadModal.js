import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './BulkUploadModal.css'; // Let's also create basic css for it

const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

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
        
        const personalData = workbook.Sheets['Personal'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Personal']) : [];
        const professionalData = workbook.Sheets['Professional'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Professional']) : [];
        const familyData = workbook.Sheets['Family'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Family']) : [];
        const addressData = workbook.Sheets['Address'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Address']) : [];
        const bankData = workbook.Sheets['Bank'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Bank']) : [];
        const emergencyData = workbook.Sheets['Emergency'] ? XLSX.utils.sheet_to_json(workbook.Sheets['Emergency']) : [];

        let formattedData = [];

        if (personalData.length === 0 && workbook.SheetNames.length > 0 && !workbook.Sheets['Professional']) {
          // Fallback to single sheet flat parsing
          const firstSheetName = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
          
          formattedData = rawData.map(row => {
            return {
              user: { email: row.Email || row.PersonalEmail || row.WorkEmail || '' },
              personal: {
                fullName: row.FullName || row.Name || '',
                gender: row.Gender || '',
                dob: row.DOB || '',
                mobile: row.Mobile || row.Phone || '',
                personalEmail: row.PersonalEmail || row.Email || '',
                bloodGroup: row.BloodGroup || ''
              },
              professional: {
                department: row.Department || '',
                jobTitle: row.JobTitle || '',
                dateJoined: row.DateJoined || '',
                workEmail: row.WorkEmail || ''
              }
            };
          });
        } else {
          // Parse multiple sheets grouped by EmpCode or Email
          const employeesMap = new Map();

          const getOrCreateEmp = (key) => {
            if (!employeesMap.has(key)) {
              employeesMap.set(key, {
                emp_code: '',
                user: { email: '' },
                personal: { fullName: '', gender: '', dob: '', mobile: '', personalEmail: '', bloodGroup: '' },
                professional: { department: '', jobTitle: '', dateJoined: '', workEmail: '', reportingManager: '', attendanceBiometricId: '', linkedinUrl: '', inProbation: false },
                family: { fatherName: '', motherName: '', maritalStatus: 'Single', spouseName: '', marriageDate: '' },
                address: { currentAddress: { street: '', city: '', state: '', pincode: '', country: 'India' }, permanentAddress: { street: '', city: '', state: '', pincode: '', country: 'India' } },
                bank: { companyOpensBank: false, panNumber: '', aadharNumber: '', bankName: '', branch: '', personalAccountNumber: '', personalIfsc: '', salaryAccountNumber: '', salaryIfsc: '' },
                emergency: { emergencyContact1: { name: '', relationship: '', mobile: '' }, emergencyContact2: { name: '', relationship: '', mobile: '' } }
              });
            }
            return employeesMap.get(key);
          };

          const processDate = (dateVal) => {
            if (!dateVal) return '';
            if (typeof dateVal === 'number') {
              // Excel date starts from 1900-01-01
              const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
              return date.toISOString().split('T')[0];
            }
            try {
              return new Date(dateVal).toISOString().split('T')[0];
            } catch (e) {
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
                bloodGroup: row.BloodGroup || ''
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
                inProbation: row.Probation === 'Yes'
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
                marriageDate: processDate(row.MarriageDate)
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
                   country: row.CurrentCountry || 'India'
                },
                permanentAddress: {
                   street: row.PermStreet || '',
                   city: row.PermCity || '',
                   state: row.PermState || '',
                   pincode: row.PermPincode || '',
                   country: row.PermCountry || 'India'
                }
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
                salaryIfsc: row.SalaryIFSC || ''
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
                   mobile: row.PrimaryContactMobile || ''
                },
                emergencyContact2: {
                   name: row.SecondaryContactName || '',
                   relationship: row.SecondaryContactRelationship || '',
                   mobile: row.SecondaryContactMobile || ''
                }
             };
          });

          formattedData = Array.from(employeesMap.values());
        }

        setParsedData(formattedData);
        setLoading(false);
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
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // If we don't have axios interceptors, just making sure we send it if needed, or axios handles it via interceptor or defaults
      // Assuming axios defaults are set up with token elsewhere, otherwise we should pass headers.
      await axios.post('/hr/bulk-upload', { employees: parsedData });
      
      alert('Bulk upload completed successfully!');
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content bulk-upload-modal">
        <div className="modal-header">
          <h2>Bulk Upload Employees</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          
          {parsedData.length === 0 ? (
            <div className="upload-section">
              <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
              <button className="btn btn-primary" onClick={handleParseExcel} disabled={loading || !file}>
                {loading ? 'Parsing...' : 'Parse Excel'}
              </button>
            </div>
          ) : (
            <div className="preview-section">
              <p>Found {parsedData.length} records. Please review and fill missing details.</p>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email (Required)</th>
                      <th>Full Name</th>
                      <th>Mobile</th>
                      <th>Department</th>
                      <th>Job Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((emp, idx) => (
                      <tr key={idx}>
                        <td>
                          <input 
                            type="email" 
                            value={emp.user.email} 
                            onChange={(e) => handleEmailChange(idx, e.target.value)}
                            placeholder="Email"
                            className={!emp.user.email ? 'input-error' : ''}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={emp.personal.fullName} 
                            onChange={(e) => handleFieldChange(idx, 'personal', 'fullName', e.target.value)}
                            placeholder="Full Name"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={emp.personal.mobile} 
                            onChange={(e) => handleFieldChange(idx, 'personal', 'mobile', e.target.value)}
                            placeholder="Mobile"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={emp.professional.department} 
                            onChange={(e) => handleFieldChange(idx, 'professional', 'department', e.target.value)}
                            placeholder="Department"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={emp.professional.jobTitle} 
                            onChange={(e) => handleFieldChange(idx, 'professional', 'jobTitle', e.target.value)}
                            placeholder="Job Title"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {parsedData.length > 0 && (
            <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Uploading...' : 'Confirm & Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
