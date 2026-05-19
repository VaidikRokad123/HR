import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Documents.css";

const fieldLabels = {
  name: "Name",
  gender: "Gender",
  internType: "Job Type",
  durationType: "Duration Type",
  duration: "Duration",
  role: "Role",
  startDate: "Start Date",
  endDate: "End Date",
  salaryType: "Salary Type",
  salaryAmount: "Salary Amount",
  companyName: "Company Name",
  signatoryName: "Signatory Name",
  signatoryTitle: "Signatory Title",
  currentSalary: "Current CTC",
  revisedSalaryDate: "Revised Salary Effective Date",
};

const getDesignation = (employee) =>
  employee.professional?.designation || employee.professional?.jobTitle || "";

const initialOfferForm = {
  name: "",
  gender: "",
  internType: "internship",
  durationType: "month",
  duration: "",
  role: "",
  startDate: "",
  endDate: "",
  salaryType: "paid",
  salaryAmount: "",
  companyName: "Saeculum Solutions Pvt. Ltd.",
  signatoryName: "HARDIKKUMAR VINZAVA",
  signatoryTitle: "DIRECTOR",
};

const initialAppraisalForm = {
  name: "",
  gender: "",
  role: "",
  currentSalary: "",
  revisedSalaryDate: "",
  companyName: "Saeculum Solutions Pvt. Ltd.",
  signatoryName: "HARDIKKUMAR VINZAVA",
  signatoryTitle: "DIRECTOR",
};

const initialForm = { ...initialOfferForm, ...initialAppraisalForm };

function Documents() {
  const navigate = useNavigate();
  const [documentTypes, setDocumentTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedType, setSelectedType] = useState("offer-letter");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(initialForm);
  const [missingFields, setMissingFields] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [typesResponse, employeesResponse] = await Promise.all([
          axios.get("/documents/types"),
          axios.get("/employees/all"),
        ]);
        setDocumentTypes(typesResponse.data);
        setEmployees(employeesResponse.data);
      } catch (err) {
        setError("Failed to load document setup.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredEmployees = useMemo(() => {
    const value = searchTerm.toLowerCase();
    return employees.filter(
      (employee) =>
        employee.personal?.fullName?.toLowerCase().includes(value) ||
        employee.user?.emp_code?.toLowerCase().includes(value) ||
        employee.user?.email?.toLowerCase().includes(value) ||
        getDesignation(employee).toLowerCase().includes(value),
    );
  }, [employees, searchTerm]);

  const selectedEmployee = employees.find(
    (employee) => employee.user.id === selectedEmployeeId,
  );

  const inspectEmployee = async (employeeId) => {
    try {
      setError("");
      setSelectedEmployeeId(employeeId);
      const endpoint =
        selectedType === "appraisal-letter"
          ? `/documents/appraisal-letter/${employeeId}/inspect`
          : `/documents/offer-letter/${employeeId}/inspect`;
      const response = await axios.get(endpoint);
      setForm({ ...initialForm, ...response.data.values });
      setMissingFields(response.data.missingFields || []);
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to inspect employee information.",
      );
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMissingFields((current) => current.filter((item) => item !== field));
  };

  const prepareDocument = async () => {
    try {
      setPreparing(true);
      setError("");
      const endpoint =
        selectedType === "appraisal-letter"
          ? `/documents/appraisal-letter/${selectedEmployeeId}/prepare`
          : `/documents/offer-letter/${selectedEmployeeId}/prepare`;
      const response = await axios.post(endpoint, form);
      navigate("/documents/editor", {
        state: {
          pages: response.data.data.pages,
          metadata: response.data.data.metadata,
          documentType: selectedType,
        },
      });
    } catch (err) {
      setMissingFields(err.response?.data?.missingFields || []);
      setError(err.response?.data?.message || "Failed to prepare document.");
    } finally {
      setPreparing(false);
    }
  };

  if (loading) return <div className="loading">Loading</div>;

  return (
    <div className="container documents-page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Generate Documents</h1>
            <p>
              Select a document type, choose an employee, complete details, then
              edit and compile.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="doc-steps" aria-label="Document generation progress">
        {["Document", "Employee", "Details", "Editor"].map((label, index) => (
          <div
            key={label}
            className={`doc-step ${step >= index + 1 ? "doc-step--active" : ""}`}
          >
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <h3>Document Type</h3>
          <div className="document-type-grid">
            {documentTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`document-type ${selectedType === type.id ? "document-type--selected" : ""}`}
                disabled={!type.available}
                onClick={() => setSelectedType(type.id)}
              >
                <span>{type.label}</span>
                <small>
                  {type.available ? "Available now" : "Coming next"}
                </small>
              </button>
            ))}
          </div>
          <div className="wizard-buttons">
            <span />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h3>Choose Employee</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search by name, employee code, email, or role..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Emp Code</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.user.id}>
                    <td>{employee.user.emp_code}</td>
                    <td className="cell-title">
                      {employee.personal?.fullName || "N/A"}
                    </td>
                    <td>{getDesignation(employee) || "N/A"}</td>
                    <td>{employee.user.email}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => inspectEmployee(employee.user.id)}
                        >
                          Choose
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="wizard-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <span />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h3>
            {selectedType === "appraisal-letter"
              ? "Complete Appraisal Letter Details"
              : "Complete Offer Letter Details"}
          </h3>
          {selectedEmployee && (
            <div className="selected-employee-strip">
              <strong>
                {selectedEmployee.personal?.fullName ||
                  selectedEmployee.user.email}
              </strong>
              <span>{selectedEmployee.user.emp_code}</span>
              <span>{getDesignation(selectedEmployee) || "Role pending"}</span>
            </div>
          )}

          {missingFields.length > 0 && (
            <div className="alert alert-warning">
              Missing:{" "}
              {missingFields
                .map((field) => fieldLabels[field] || field)
                .join(", ")}
            </div>
          )}

          <div className="grid-3">
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Role / Designation</label>
              <input
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
              />
            </div>

            {selectedType === "offer-letter" && (
              <>
                <div className="form-group">
                  <label>Job Type</label>
                  <select
                    value={form.internType}
                    onChange={(event) =>
                      updateField("internType", event.target.value)
                    }
                  >
                    <option value="internship">Internship</option>
                    <option value="part time">Part Time</option>
                    <option value="full time">Full Time</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration Type</label>
                  <select
                    value={form.durationType}
                    onChange={(event) =>
                      updateField("durationType", event.target.value)
                    }
                  >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={(event) =>
                      updateField("duration", event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Salary Type</label>
                  <select
                    value={form.salaryType}
                    onChange={(event) =>
                      updateField("salaryType", event.target.value)
                    }
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                {form.salaryType === "paid" && (
                  <div className="form-group">
                    <label>Salary Amount</label>
                    <input
                      value={form.salaryAmount}
                      onChange={(event) =>
                        updateField("salaryAmount", event.target.value)
                      }
                    />
                  </div>
                )}
              </>
            )}

            {selectedType === "appraisal-letter" && (
              <>
                <div className="form-group">
                  <label>Current CTC</label>
                  <input
                    value={form.currentSalary}
                    onChange={(event) =>
                      updateField("currentSalary", event.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Revised Salary Effective Date</label>
                  <input
                    type="date"
                    value={form.revisedSalaryDate}
                    onChange={(event) =>
                      updateField("revisedSalaryDate", event.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Company Name</label>
              <input
                value={form.companyName}
                onChange={(event) =>
                  updateField("companyName", event.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Signatory</label>
              <input
                value={form.signatoryName}
                onChange={(event) =>
                  updateField("signatoryName", event.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Signatory Title</label>
              <input
                value={form.signatoryTitle}
                onChange={(event) =>
                  updateField("signatoryTitle", event.target.value)
                }
              />
            </div>
          </div>

          <div className="wizard-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={prepareDocument}
              disabled={preparing}
            >
              {preparing ? "Preparing..." : "Open Advanced Editor"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
