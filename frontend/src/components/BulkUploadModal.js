import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./BulkUploadModal.css";

const toEmployeeModelPayload = (emp) => ({
  emp_code: emp.emp_code,
  user: emp.user,
  personal: {
    ...emp.personal,
    personalMobile: emp.personal?.personalMobile || emp.personal?.mobile || "",
  },
  professional: {
    ...emp.professional,
    designation:
      emp.professional?.designation || emp.professional?.jobTitle || "",
    dateJoining:
      emp.professional?.dateJoining || emp.professional?.dateJoined || "",
    officialEmail:
      emp.professional?.officialEmail || emp.professional?.workEmail || "",
    probationMonths:
      emp.professional?.probationMonths ?? emp.professional?.probationDuration,
  },
  family: emp.family,
  address: emp.address,
  bank: {
    ...emp.bank,
    bankNameBranch: emp.bank?.bankNameBranch || emp.bank?.bankName || "",
    accountNumber:
      emp.bank?.accountNumber || emp.bank?.personalAccountNumber || "",
    ifscCode: emp.bank?.ifscCode || emp.bank?.personalIfsc || "",
  },
  emergency: {
    emergencyContacts: [
      emp.emergency?.emergencyContact1,
      emp.emergency?.emergencyContact2,
    ]
      .filter(Boolean)
      .map((contact) => ({
        name: contact.name || "",
        relationship: contact.relationship || "",
        phone: contact.phone || contact.mobile || "",
      })),
  },
});

const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedData([]);
      setError("");
      setActiveTab("upload");
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsedData([]);
      setError("");
      setActiveTab("upload");
    }
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleParseExcel = () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const personalData = workbook.Sheets["Personal"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Personal"])
          : [];
        const professionalData = workbook.Sheets["Professional"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Professional"])
          : [];
        const familyData = workbook.Sheets["Family"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Family"])
          : [];
        const addressData = workbook.Sheets["Address"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Address"])
          : [];
        const bankData = workbook.Sheets["Bank"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Bank"])
          : [];
        const emergencyData = workbook.Sheets["Emergency"]
          ? XLSX.utils.sheet_to_json(workbook.Sheets["Emergency"])
          : [];

        let formattedData = [];

        if (
          personalData.length === 0 &&
          workbook.SheetNames.length > 0 &&
          !workbook.Sheets["Professional"]
        ) {
          const firstSheetName = workbook.SheetNames[0];
          const rawData = XLSX.utils.sheet_to_json(
            workbook.Sheets[firstSheetName],
          );

          formattedData = rawData.map((row) => ({
            user: {
              email:
                row.Email ||
                row.PersonalEmail ||
                row.OfficialEmail ||
                row.WorkEmail ||
                "",
            },
            personal: {
              fullName: row.FullName || row.Name || "",
              gender: row.Gender || "",
              dob: row.DOB || "",
              mobile: row.PersonalMobile || row.Mobile || row.Phone || "",
              personalEmail: row.PersonalEmail || row.Email || "",
              bloodGroup: row.BloodGroup || "",
            },
            professional: {
              department: row.Department || "",
              jobTitle: row.Designation || row.JobTitle || "",
              dateJoined: row.DateJoining || row.DateJoined || "",
              workEmail: row.OfficialEmail || row.WorkEmail || "",
            },
          }));
        } else {
          const employeesMap = new Map();

          const getOrCreateEmp = (key) => {
            if (!employeesMap.has(key)) {
              employeesMap.set(key, {
                emp_code: "",
                user: { email: "" },
                personal: {
                  fullName: "",
                  gender: "",
                  dob: "",
                  mobile: "",
                  personalEmail: "",
                  bloodGroup: "",
                },
                professional: {
                  department: "",
                  jobTitle: "",
                  dateJoined: "",
                  workEmail: "",
                  reportingManager: "",
                  attendanceBiometricId: "",
                  linkedinUrl: "",
                  inProbation: false,
                },
                family: {
                  fatherName: "",
                  motherName: "",
                  maritalStatus: "Single",
                  spouseName: "",
                  marriageDate: "",
                },
                address: {
                  currentAddress: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India",
                  },
                  permanentAddress: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India",
                  },
                },
                bank: {
                  companyOpensBank: false,
                  panNumber: "",
                  aadharNumber: "",
                  bankName: "",
                  branch: "",
                  personalAccountNumber: "",
                  personalIfsc: "",
                  salaryAccountNumber: "",
                  salaryIfsc: "",
                },
                emergency: {
                  emergencyContact1: { name: "", relationship: "", mobile: "" },
                  emergencyContact2: { name: "", relationship: "", mobile: "" },
                },
              });
            }
            return employeesMap.get(key);
          };

          const processDate = (dateVal) => {
            if (!dateVal) return "";
            if (typeof dateVal === "number") {
              const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
              return date.toISOString().split("T")[0];
            }
            try {
              return new Date(dateVal).toISOString().split("T")[0];
            } catch (err) {
              console.error("❌ Caught Error:", err);
              return dateVal;
            }
          };

          personalData.forEach((row, idx) => {
            const key =
              row.EmpCode || row.Email || row.PersonalEmail || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            if (!emp.user.email)
              emp.user.email =
                row.Email ||
                row.PersonalEmail ||
                row.OfficialEmail ||
                row.WorkEmail ||
                "";
            emp.personal = {
              ...emp.personal,
              fullName: row.FullName || row.Name || "",
              gender: row.Gender || "",
              dob: processDate(row.DOB),
              age: row.Age || "",
              mobile: row.PersonalMobile || row.Mobile || row.Phone || "",
              personalEmail: row.PersonalEmail || row.Email || "",
              bloodGroup: row.BloodGroup || "",
            };
          });

          professionalData.forEach((row, idx) => {
            const key =
              row.EmpCode ||
              row.Email ||
              row.OfficialEmail ||
              row.WorkEmail ||
              `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            if (!emp.user.email)
              emp.user.email =
                row.OfficialEmail || row.WorkEmail || row.Email || "";
            emp.professional = {
              ...emp.professional,
              department: row.Department || "",
              jobTitle: row.Designation || row.JobTitle || "",
              dateJoined: processDate(row.DateJoining || row.DateJoined),
              reportingManager: row.ReportingManager || "",
              workEmail: row.OfficialEmail || row.WorkEmail || "",
              attendanceBiometricId: row.BiometricId || "",
              linkedinUrl: row.LinkedIn || "",
              inProbation: row.Probation === "Yes",
            };
          });

          familyData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.family = {
              ...emp.family,
              fatherName: row.FatherName || "",
              motherName: row.MotherName || "",
              maritalStatus:
                row["Marital Status"] || row.MaritalStatus || "Single",
              spouseName: row.SpouseName || "",
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
                street: row.CurrentStreet || "",
                city: row.CurrentCity || "",
                state: row.CurrentState || "",
                pincode: row.CurrentPincode || "",
                country: row.CurrentCountry || "India",
              },
              permanentAddress: {
                street: row.PermStreet || "",
                city: row.PermCity || "",
                state: row.PermState || "",
                pincode: row.PermPincode || "",
                country: row.PermCountry || "India",
              },
            };
          });

          bankData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.bank = {
              ...emp.bank,
              companyOpensBank: row.CompanyOpensBank === "Yes",
              panNumber: row.PANNumber || "",
              aadharNumber: row.AadharNumber || "",
              bankName: row.BankNameBranch || row.BankName || "",
              branch: row.Branch || "",
              personalAccountNumber:
                row.AccountNumber || row.PersonalAccountNumber || "",
              personalIfsc: row.IFSCCode || row.PersonalIFSC || "",
              salaryAccountNumber: row.SalaryAccountNumber || "",
              salaryIfsc: row.SalaryIFSC || "",
            };
          });

          emergencyData.forEach((row, idx) => {
            const key = row.EmpCode || `temp_${idx}`;
            const emp = getOrCreateEmp(key);
            if (row.EmpCode) emp.emp_code = row.EmpCode;
            emp.emergency = {
              ...emp.emergency,
              emergencyContact1: {
                name: row.PrimaryContactName || "",
                relationship: row.PrimaryContactRelationship || "",
                mobile: row.PrimaryContactMobile || "",
              },
              emergencyContact2: {
                name: row.SecondaryContactName || "",
                relationship: row.SecondaryContactRelationship || "",
                mobile: row.SecondaryContactMobile || "",
              },
            };
          });

          formattedData = Array.from(employeesMap.values());
        }

        setParsedData(formattedData);
        setLoading(false);
        if (formattedData.length === 0) {
          setError("No employee rows found. Check sheet names and columns.");
          setActiveTab("upload");
        } else {
          setActiveTab("review");
        }
      } catch (err) {
        console.error("❌ Caught Error:", err);
        setError("Error parsing Excel file.");
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

  const handleNestedFieldChange = (
    index,
    category,
    subcategory,
    field,
    value,
  ) => {
    const newData = [...parsedData];
    newData[index][category][subcategory][field] = value;
    setParsedData(newData);
  };

  const handleEmailChange = (index, value) => {
    const newData = [...parsedData];
    newData[index].user.email = value;
    newData[index].personal.personalEmail = value;
    setParsedData(newData);
  };

  const handleRemoveEmployee = (index) => {
    const newData = [...parsedData];
    newData.splice(index, 1);
    setParsedData(newData);
    if (newData.length === 0) {
      setActiveTab("upload");
    }
  };

  const handleSubmit = async () => {
    const validEmployees = parsedData.filter(
      (emp) => emp.user.email && emp.user.email.trim() !== "",
    );

    if (validEmployees.length === 0) {
      alert("No employees with a valid email found for upload.");
      return;
    }

    if (validEmployees.length < parsedData.length) {
      if (
        !window.confirm(
          `Found ${parsedData.length - validEmployees.length} employee(s) without an email. They will be skipped. Continue?`,
        )
      ) {
        return;
      }
    }
    try {
      setLoading(true);
      const response = await axios.post("/employees/bulk-upload", {
        employees: validEmployees.map(toEmployeeModelPayload),
      });

      if (response.data.errorCount > 0) {
        alert(
          `Upload finished, but ${response.data.errorCount} row(s) failed to save.\n\nThis usually happens when an employee is missing required fields for the current Employee model (like Full Name, Gender, DOB, Mobile, Personal Email, PAN/Aadhaar, education, or employment data). Check the Node console for exact details.`,
        );
      } else {
        alert("Bulk upload completed successfully!");
      }
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error during bulk upload");
    } finally {
      setLoading(false);
    }
  };

  const goUploadTab = () => {
    setActiveTab("upload");
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
            <p className="bulk-modal-sub">
              Excel (.xlsx / .xls) · multi-sheet or single flat sheet
            </p>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="bulk-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "upload"}
            className={`bulk-tab${activeTab === "upload" ? " active" : ""}`}
            onClick={goUploadTab}
          >
            <span className="bulk-tab-num">1</span>
            <span className="bulk-tab-label">Upload Excel</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "review"}
            className={`bulk-tab${activeTab === "review" ? " active" : ""}`}
            disabled={parsedData.length === 0}
            onClick={() => parsedData.length > 0 && setActiveTab("review")}
          >
            <span className="bulk-tab-num">2</span>
            <span className="bulk-tab-label">Review &amp; confirm</span>
          </button>
        </div>

        <div className="modal-body bulk-modal-body">
          {error && <div className="alert alert-error bulk-alert">{error}</div>}

          {activeTab === "upload" && (
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
                  {file ? file.name : "Drop a file here or click to browse"}
                </p>
                <p className="bulk-drop-hint">
                  Maximum practical size depends on your network; keep under a
                  few MB.
                </p>
              </button>

              <div className="bulk-sheet-hints">
                <span className="bulk-hint-label">Multi-sheet template</span>
                <p>
                  Sheets: <span className="hl-sheet">Personal</span>,{" "}
                  <span className="hl-sheet">Professional</span>,{" "}
                  <span className="hl-sheet">Family</span>,{" "}
                  <span className="hl-sheet">Address</span>,{" "}
                  <span className="hl-sheet">Bank</span>,{" "}
                  <span className="hl-sheet">Emergency</span> — keyed by{" "}
                  <strong>EmpCode</strong> or email.
                </p>
                <p className="bulk-hint-alt">
                  Or one sheet with columns such as Email, FullName, Department…
                  (export from this app matches the template).
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
                      <i
                        className="ti ti-loader bulk-spin"
                        aria-hidden="true"
                      />{" "}
                      Parsing…
                    </>
                  ) : (
                    <>
                      <i
                        className="ti ti-table-import"
                        aria-hidden="true"
                        style={{ marginRight: 8 }}
                      />
                      Parse Excel
                    </>
                  )}
                </button>
                {file && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleDropZoneClick}
                  >
                    Change file
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "review" && parsedData.length > 0 && (
            <div
              className="bulk-review-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "65vh",
              }}
            >
              <div
                className="bulk-review-banner"
                style={{ marginBottom: "10px" }}
              >
                <i className="ti ti-table" aria-hidden="true" />
                <div>
                  <p className="bulk-review-count">
                    Reviewing{" "}
                    <span className="bulk-count-n">{parsedData.length}</span>{" "}
                    Employees
                  </p>
                  <p className="bulk-review-sub">
                    Edit details directly in the table. Employees without an
                    email will be skipped.
                  </p>
                </div>
              </div>

              <div className="bulk-table-container">
                <table className="bulk-review-table">
                  <thead>
                    <tr>
                      <th colSpan="8" className="bg-personal">
                        Personal
                      </th>
                      <th colSpan="8" className="bg-professional">
                        Professional
                      </th>
                      <th colSpan="5" className="bg-family">
                        Family
                      </th>
                      <th colSpan="10" className="bg-address">
                        Address
                      </th>
                      <th colSpan="9" className="bg-bank">
                        Bank
                      </th>
                      <th colSpan="6" className="bg-emergency">
                        Emergency
                      </th>
                      <th className="bg-actions">Actions</th>
                    </tr>
                    <tr>
                      {/* Personal */}
                      <th className="sticky-col" style={{ left: 0 }}>
                        Email <span className="req">*</span>
                      </th>
                      <th className="sticky-col" style={{ left: "150px" }}>
                        Emp Code
                      </th>
                      <th>Full Name</th>
                      <th>Gender</th>
                      <th>DOB</th>
                      <th>Mobile</th>
                      <th>Personal Email</th>
                      <th>Blood Group</th>

                      {/* Professional */}
                      <th>Department</th>
                      <th>Job Title</th>
                      <th>Date Joined</th>
                      <th>Reporting Manager</th>
                      <th>Work Email</th>
                      <th>Biometric ID</th>
                      <th>LinkedIn</th>
                      <th>In Probation</th>

                      {/* Family */}
                      <th>Father Name</th>
                      <th>Mother Name</th>
                      <th>Marital Status</th>
                      <th>Spouse Name</th>
                      <th>Marriage Date</th>

                      {/* Address */}
                      <th>Curr Street</th>
                      <th>Curr City</th>
                      <th>Curr State</th>
                      <th>Curr Pincode</th>
                      <th>Curr Country</th>
                      <th>Perm Street</th>
                      <th>Perm City</th>
                      <th>Perm State</th>
                      <th>Perm Pincode</th>
                      <th>Perm Country</th>

                      {/* Bank */}
                      <th>Co. Opens Bank</th>
                      <th>PAN</th>
                      <th>Aadhar</th>
                      <th>Bank Name</th>
                      <th>Branch</th>
                      <th>Personal Acc</th>
                      <th>Personal IFSC</th>
                      <th>Salary Acc</th>
                      <th>Salary IFSC</th>

                      {/* Emergency */}
                      <th>E1 Name</th>
                      <th>E1 Relation</th>
                      <th>E1 Mobile</th>
                      <th>E2 Name</th>
                      <th>E2 Relation</th>
                      <th>E2 Mobile</th>

                      <th>Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((emp, index) => (
                      <tr key={index}>
                        {/* Personal */}
                        <td className="sticky-col" style={{ left: 0 }}>
                          <input
                            type="email"
                            value={emp.user.email}
                            onChange={(e) =>
                              handleEmailChange(index, e.target.value)
                            }
                            className={`bulk-cell-input-small ${!emp.user.email ? "input-error" : ""}`}
                            style={{ width: "140px" }}
                          />
                        </td>
                        <td className="sticky-col" style={{ left: "150px" }}>
                          <input
                            type="text"
                            value={emp.emp_code}
                            onChange={(e) => {
                              const newData = [...parsedData];
                              newData[index].emp_code = e.target.value;
                              setParsedData(newData);
                            }}
                            className="bulk-cell-input-small"
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.personal.fullName}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "fullName",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "120px" }}
                          />
                        </td>
                        <td>
                          <select
                            value={emp.personal.gender}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "gender",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            value={emp.personal.dob}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "dob",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "110px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.personal.mobile}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "mobile",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={emp.personal.personalEmail}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "personalEmail",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "140px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.personal.bloodGroup}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "personal",
                                "bloodGroup",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "60px" }}
                          />
                        </td>

                        {/* Professional */}
                        <td>
                          <input
                            type="text"
                            value={emp.professional.department}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "department",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.professional.jobTitle}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "jobTitle",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={emp.professional.dateJoined}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "dateJoined",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "110px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.professional.reportingManager}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "reportingManager",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "120px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={emp.professional.workEmail}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "workEmail",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "140px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.professional.attendanceBiometricId}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "attendanceBiometricId",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.professional.linkedinUrl}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "linkedinUrl",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={emp.professional.inProbation}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "professional",
                                "inProbation",
                                e.target.checked,
                              )
                            }
                          />
                        </td>

                        {/* Family */}
                        <td>
                          <input
                            type="text"
                            value={emp.family.fatherName}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "family",
                                "fatherName",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.family.motherName}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "family",
                                "motherName",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <select
                            value={emp.family.maritalStatus}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "family",
                                "maritalStatus",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "90px" }}
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.family.spouseName}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "family",
                                "spouseName",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={emp.family.marriageDate}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "family",
                                "marriageDate",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "110px" }}
                          />
                        </td>

                        {/* Address */}
                        <td>
                          <input
                            type="text"
                            value={emp.address.currentAddress.street}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "currentAddress",
                                "street",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "120px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.currentAddress.city}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "currentAddress",
                                "city",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.currentAddress.state}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "currentAddress",
                                "state",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.currentAddress.pincode}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "currentAddress",
                                "pincode",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "70px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.currentAddress.country}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "currentAddress",
                                "country",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "70px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.permanentAddress.street}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "permanentAddress",
                                "street",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "120px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.permanentAddress.city}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "permanentAddress",
                                "city",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.permanentAddress.state}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "permanentAddress",
                                "state",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.permanentAddress.pincode}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "permanentAddress",
                                "pincode",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "70px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.address.permanentAddress.country}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "address",
                                "permanentAddress",
                                "country",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "70px" }}
                          />
                        </td>

                        {/* Bank */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={emp.bank.companyOpensBank}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "companyOpensBank",
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.panNumber}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "panNumber",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.aadharNumber}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "aadharNumber",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.bankName}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "bankName",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.branch}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "branch",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "90px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.personalAccountNumber}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "personalAccountNumber",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "110px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.personalIfsc}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "personalIfsc",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.salaryAccountNumber}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "salaryAccountNumber",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "110px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.bank.salaryIfsc}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "bank",
                                "salaryIfsc",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>

                        {/* Emergency */}
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact1.name}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact1",
                                "name",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact1.relationship}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact1",
                                "relationship",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact1.mobile}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact1",
                                "mobile",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact2.name}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact2",
                                "name",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact2.relationship}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact2",
                                "relationship",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={emp.emergency.emergencyContact2.mobile}
                            onChange={(e) =>
                              handleNestedFieldChange(
                                index,
                                "emergency",
                                "emergencyContact2",
                                "mobile",
                                e.target.value,
                              )
                            }
                            className="bulk-cell-input-small"
                            style={{ width: "100px" }}
                          />
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(index)}
                            className="remove-btn-cell"
                          >
                            <i className="ti ti-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer bulk-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {activeTab === "review" && parsedData.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || parsedData.length === 0}
            >
              {loading ? "Uploading…" : `Confirm & Upload All`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
