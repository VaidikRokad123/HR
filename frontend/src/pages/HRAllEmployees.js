import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const HRAllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get('/hr/all-employees');
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.user.emp_code?.toLowerCase().includes(searchLower) ||
      emp.personal?.fullName?.toLowerCase().includes(searchLower) ||
      emp.professional?.department?.toLowerCase().includes(searchLower) ||
      emp.professional?.jobTitle?.toLowerCase().includes(searchLower)
    );
  });

  const exportToExcel = async () => {
    try {
      if (!employees || employees.length === 0) {
        alert('No employee data to export.');
        return;
      }

      // Prepare Data for multiple sheets
      const personalSheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        Email: emp.user?.email,
        FullName: emp.personal?.fullName || '',
        Gender: emp.personal?.gender || '',
        DOB: emp.personal?.dob ? new Date(emp.personal.dob).toLocaleDateString() : '',
        Age: emp.personal?.age || '',
        Mobile: emp.personal?.mobile || '',
        PersonalEmail: emp.personal?.personalEmail || '',
        BloodGroup: emp.personal?.bloodGroup || ''
      }));

      const professionalSheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        FullName: emp.personal?.fullName || '',
        Department: emp.professional?.department || '',
        JobTitle: emp.professional?.jobTitle || '',
        DateJoined: emp.professional?.dateJoined ? new Date(emp.professional.dateJoined).toLocaleDateString() : '',
        ReportingManager: emp.professional?.reportingManager || '',
        WorkEmail: emp.professional?.workEmail || '',
        BiometricId: emp.professional?.attendanceBiometricId || '',
        LinkedIn: emp.professional?.linkedinUrl || '',
        Probation: emp.professional?.inProbation ? 'Yes' : 'No'
      }));

      const familySheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        FullName: emp.personal?.fullName || '',
        FatherName: emp.family?.fatherName || '',
        MotherName: emp.family?.motherName || '',
        'Marital Status': emp.family?.maritalStatus || 'Single',
        SpouseName: emp.family?.spouseName || '',
        MarriageDate: emp.family?.marriageDate ? new Date(emp.family.marriageDate).toLocaleDateString() : ''
      }));

      const addressSheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        FullName: emp.personal?.fullName || '',
        CurrentStreet: emp.address?.currentAddress?.street || '',
        CurrentCity: emp.address?.currentAddress?.city || '',
        CurrentState: emp.address?.currentAddress?.state || '',
        CurrentPincode: emp.address?.currentAddress?.pincode || '',
        PermStreet: emp.address?.permanentAddress?.street || '',
        PermCity: emp.address?.permanentAddress?.city || '',
        PermState: emp.address?.permanentAddress?.state || '',
        PermPincode: emp.address?.permanentAddress?.pincode || ''
      }));

      const bankSheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        FullName: emp.personal?.fullName || '',
        CompanyOpensBank: emp.bank?.companyOpensBank ? 'Yes' : 'No',
        PANNumber: emp.bank?.panNumber || '',
        AadharNumber: emp.bank?.aadharNumber || '',
        BankName: emp.bank?.bankName || '',
        Branch: emp.bank?.branch || '',
        PersonalAccountNumber: emp.bank?.personalAccountNumber || '',
        PersonalIFSC: emp.bank?.personalIfsc || '',
        SalaryAccountNumber: emp.bank?.salaryAccountNumber || '',
        SalaryIFSC: emp.bank?.salaryIfsc || ''
      }));

      const emergencySheet = employees.map(emp => ({
        EmpCode: emp.user?.emp_code,
        FullName: emp.personal?.fullName || '',
        PrimaryContactName: emp.emergency?.emergencyContact1?.name || '',
        PrimaryContactRelationship: emp.emergency?.emergencyContact1?.relationship || '',
        PrimaryContactMobile: emp.emergency?.emergencyContact1?.mobile || '',
        SecondaryContactName: emp.emergency?.emergencyContact2?.name || '',
        SecondaryContactRelationship: emp.emergency?.emergencyContact2?.relationship || '',
        SecondaryContactMobile: emp.emergency?.emergencyContact2?.mobile || ''
      }));

      // Generate Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(personalSheet), 'Personal');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(professionalSheet), 'Professional');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(familySheet), 'Family');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(addressSheet), 'Address');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankSheet), 'Bank');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(emergencySheet), 'Emergency');

      // Export file
      XLSX.writeFile(wb, 'Saeculum_Employees_Data.xlsx');
    } catch (err) {
      console.error('Export Error:', err);
      alert('Failed to export employee data. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>All Employees</h1>
            <p>{employees.length} approved employee(s)</p>
          </div>
          <button className="btn btn-success" onClick={exportToExcel}>
            <i className="ti ti-file-excel" style={{ marginRight: '6px' }}></i> Export All to Excel
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search by name, emp code, department, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aab3bc' }}>
            No employees found.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Emp Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Date Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.user.id}>
                  <td>{employee.user.emp_code}</td>
                  <td>{employee.personal?.fullName || 'N/A'}</td>
                  <td>{employee.professional?.department || 'N/A'}</td>
                  <td>{employee.professional?.jobTitle || 'N/A'}</td>
                  <td>
                    {employee.professional?.dateJoined 
                      ? new Date(employee.professional.dateJoined).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/hr/employee/${employee.user.id}`)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HRAllEmployees;
