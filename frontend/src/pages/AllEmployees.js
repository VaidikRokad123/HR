import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import BulkUploadModal from "../components/BulkUploadModal";

const getDesignation = (employee) =>
  employee.professional?.designation || employee.professional?.jobTitle || "";
const getDateJoining = (employee) =>
  employee.professional?.dateJoining || employee.professional?.dateJoined;
const getPersonalMobile = (employee) =>
  employee.personal?.personalMobile || employee.personal?.mobile || "";
const getOfficialEmail = (employee) =>
  employee.professional?.officialEmail ||
  employee.professional?.workEmail ||
  "";
const getBankName = (employee) =>
  employee.bank?.bankNameBranch || employee.bank?.bankName || "";
const getAccountNumber = (employee) =>
  employee.bank?.accountNumber || employee.bank?.personalAccountNumber || "";
const getIfscCode = (employee) =>
  employee.bank?.ifscCode || employee.bank?.personalIfsc || "";

const AllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get("/employees/all");
      setEmployees(response.data);
    } catch (err) {
      setError("Failed to load employees");
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
      getDesignation(emp).toLowerCase().includes(searchLower) ||
      emp.user.status?.toLowerCase().includes(searchLower)
    );
  });

  const completeCount = employees.filter(
    (employee) => Number(employee.completionPercentage || 0) >= 100,
  ).length;
  const incompleteCount = employees.length - completeCount;
  const getEmployeeStatus = (status) =>
    status === "rejected" ? "rejected" : "approved";

  const getCompletionTone = (percentage) => {
    if (percentage >= 100) return "var(--color-success, #1f8b4c)";
    if (percentage >= 60) return "#c08a00";
    return "#b42318";
  };

  const renderCompletionBar = (percentage) => {
    const safePercentage = Math.max(0, Math.min(100, Number(percentage || 0)));

    return (
      <div style={{ minWidth: "160px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "6px",
            fontSize: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          <span>Completion</span>
          <strong style={{ color: getCompletionTone(safePercentage) }}>
            {safePercentage}%
          </strong>
        </div>
        <div
          style={{
            height: "10px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${safePercentage}%`,
              height: "100%",
              borderRadius: "inherit",
              background: `linear-gradient(90deg, ${getCompletionTone(safePercentage)}, rgba(15, 23, 42, 0.75))`,
              transition: "width 180ms ease",
            }}
          />
        </div>
      </div>
    );
  };

  const exportToExcel = async () => {
    try {
      if (!employees || employees.length === 0) {
        alert("No employee data to export.");
        return;
      }

      const response = await axios.get("/employees/export");
      const exportData = response.data;

      const allDetailsSheet = exportData.map((emp) => ({
        EmpCode: emp.user?.emp_code,
        Email: emp.user?.email,
        FullName: emp.personal?.fullName || "",
        Gender: emp.personal?.gender || "",
        DOB: emp.personal?.dob
          ? new Date(emp.personal.dob).toLocaleDateString()
          : "",
        Age: emp.personal?.age || "",
        PersonalMobile: getPersonalMobile(emp),
        PersonalEmail: emp.personal?.personalEmail || "",
        BloodGroup: emp.personal?.bloodGroup || "",
        Religion: emp.personal?.religion || "",
        PhysicallyHandicapped: emp.personal?.physicallyHandicapped ? "Yes" : "No",
        Department: emp.professional?.department || "",
        Designation: getDesignation(emp),
        DateJoining: getDateJoining(emp)
          ? new Date(getDateJoining(emp)).toLocaleDateString()
          : "",
        ReportingManager: emp.professional?.reportingManager || "",
        OfficialEmail: getOfficialEmail(emp),
        BiometricId: emp.professional?.attendanceBiometricId || "",
        LinkedIn: emp.professional?.linkedinUrl || "",
        Probation: emp.professional?.inProbation ? "Yes" : "No",
        EmploymentType: emp.professional?.employmentType || "",
        ConfirmationDate: emp.professional?.confirmationDate
          ? new Date(emp.professional.confirmationDate).toLocaleDateString()
          : "",
        WorkLocation: emp.professional?.workLocation || "",
        WorkMobile: emp.professional?.workMobile || "",
        LaptopAssigned: emp.professional?.laptopAssigned ? "Yes" : "No",
        HighestQualification: emp.education?.highestQualification || "",
        GraduationYear: emp.education?.graduationYear || "",
        InstituteName: emp.education?.instituteName || "",
        Reference1Name: emp.education?.references?.[0]?.name || "",
        Reference1Phone: emp.education?.references?.[0]?.phone || "",
        Reference1Email: emp.education?.references?.[0]?.email || "",
        Reference2Name: emp.education?.references?.[1]?.name || "",
        Reference2Phone: emp.education?.references?.[1]?.phone || "",
        Reference2Email: emp.education?.references?.[1]?.email || "",
        FatherName: emp.family?.fatherName || "",
        MotherName: emp.family?.motherName || "",
        "Marital Status": emp.family?.maritalStatus || "Single",
        SpouseName: emp.family?.spouseName || "",
        MarriageDate: emp.family?.marriageDate
          ? new Date(emp.family.marriageDate).toLocaleDateString()
          : "",
        CurrentStreet: emp.address?.currentAddress?.street || "",
        CurrentCity: emp.address?.currentAddress?.city || "",
        CurrentState: emp.address?.currentAddress?.state || "",
        CurrentPincode: emp.address?.currentAddress?.pincode || "",
        PermStreet: emp.address?.permanentAddress?.street || "",
        PermCity: emp.address?.permanentAddress?.city || "",
        PermState: emp.address?.permanentAddress?.state || "",
        PermPincode: emp.address?.permanentAddress?.pincode || "",
        CompanyOpensBank: emp.bank?.companyOpensBank ? "Yes" : "No",
        PANNumber: emp.bank?.panNumber || "",
        AadharNumber: emp.bank?.aadharNumber || "",
        PassportNumber: emp.bank?.passportNumber || "",
        DrivingLicence: emp.bank?.drivingLicence || "",
        VoterIdNumber: emp.bank?.voterIdNumber || "",
        BankNameBranch: getBankName(emp),
        Branch: emp.bank?.branch || "",
        AccountNumber: getAccountNumber(emp),
        IFSCCode: getIfscCode(emp),
        SalaryAccountNumber: emp.bank?.salaryAccountNumber || "",
        SalaryIFSC: emp.bank?.salaryIfsc || "",
        AccountHolderName: emp.payroll?.accountHolderName || emp.bank?.accountHolderName || "",
        GrossSalary: emp.payroll?.gross || "",
        CTC: emp.payroll?.ctc || "",
        PFApplicable: emp.payroll?.pfApplicable ? "Yes" : "No",
        PFNumber: emp.payroll?.pfNumber || "",
        UANNumber: emp.payroll?.uanNumber || "",
        ESICApplicable: emp.payroll?.esicApplicable ? "Yes" : "No",
        ESICNumber: emp.payroll?.esicNumber || "",
        PTApplicable: emp.payroll?.ptApplicable ? "Yes" : "No",
        PTNumber: emp.payroll?.ptNumber || "",
        TDSRegime: emp.payroll?.tdsRegime || "",
        Form12BB: emp.payroll?.form12bb || "",
        PrimaryContactName: emp.emergency?.emergencyContact1?.name || "",
        PrimaryContactRelationship:
          emp.emergency?.emergencyContact1?.relationship || "",
        PrimaryContactMobile: emp.emergency?.emergencyContact1?.mobile || "",
        SecondaryContactName: emp.emergency?.emergencyContact2?.name || "",
        SecondaryContactRelationship:
          emp.emergency?.emergencyContact2?.relationship || "",
        SecondaryContactMobile: emp.emergency?.emergencyContact2?.mobile || "",
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(allDetailsSheet),
        "EmployeeDetails",
      );

      XLSX.writeFile(wb, "Saeculum_Employees_Data.xlsx");
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export employee data. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>All Employees</h1>
            <p>
              {employees.length} employee(s) · {incompleteCount} need more
              details
            </p>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/add-employee")}
            >
              <i className="ti ti-plus" aria-hidden="true" /> Add Employee
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsBulkUploadOpen(true)}
            >
              <i className="ti ti-upload" aria-hidden="true" /> Upload
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportToExcel}
            >
              <i className="ti ti-file-spreadsheet" aria-hidden="true" /> Export
            </button>
          </div>
        </div>
      </div>

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUploadSuccess={fetchAllEmployees}
      />

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
          <p className="empty-state">No employees found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Completion</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.user.id}>
                    <td>{employee.user.emp_code}</td>
                    <td className="cell-title">
                      {employee.personal?.fullName || "N/A"}
                    </td>
                    <td>{employee.professional?.department || "N/A"}</td>
                    <td>{getDesignation(employee) || "N/A"}</td>
                    <td>
                      {getDateJoining(employee)
                        ? new Date(
                          getDateJoining(employee),
                        ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${getEmployeeStatus(employee.user.status)}`}
                      >
                        {getEmployeeStatus(employee.user.status) === "approved"
                          ? "Active"
                          : "Rejected"}
                      </span>
                    </td>
                    <td>
                      {renderCompletionBar(employee.completionPercentage)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          title="View details"
                          aria-label="View details"
                          onClick={() =>
                            navigate(`/employees/${employee.user.id}`)
                          }
                        >
                          <i className="ti ti-eye" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title={
                            Number(employee.completionPercentage || 0) >= 100
                              ? "Edit employee"
                              : "Fill remaining details"
                          }
                          aria-label={
                            Number(employee.completionPercentage || 0) >= 100
                              ? "Edit employee"
                              : "Fill remaining details"
                          }
                          onClick={() =>
                            navigate(`/employees/${employee.user.id}`)
                          }
                        >
                          <i className="ti ti-pencil" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEmployees;
