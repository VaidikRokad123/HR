import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import "./EmployeeDetail.css";

const departmentOptions = [
  "Product & Delivery",
  "Human Resources",
  "Sales & marketing",
  "Design",
  "Engineering",
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
  "JR Quality Assurance Engineer",
];

const employmentTypeOptions = [
  "Temporary",
  "Permanent",
  "Contract Base",
  "Probation",
  "Internship",
  "Trainee",
  "Notice period",
];

const TABS = [
  { id: "personal", label: "Personal info" },
  { id: "employee", label: "Employee details" },
  { id: "payroll", label: "Payroll details" },
  { id: "documents", label: "Documents" },
  { id: "payroll-history", label: "Payroll history" },
];

const MISSING_SECTION_TARGETS = {
  Personal: { tab: "personal", edit: "personal" },
  Contact: { tab: "personal", edit: "address" },
  "Government ID": { tab: "employee", edit: "bank" },
  Education: { tab: "employee", edit: "professional" },
  Employment: { tab: "employee", edit: "professional" },
  Payroll: { tab: "payroll", edit: "payroll" },
};

const resolveMissingSectionTarget = (missingSections = []) => {
  for (const section of missingSections) {
    if (MISSING_SECTION_TARGETS[section]) {
      return MISSING_SECTION_TARGETS[section];
    }
  }

  return { tab: "personal", edit: null };
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAddress = (addr) => {
  if (!addr) return "N/A";
  const parts = [
    addr.street,
    addr.city,
    addr.state,
    addr.pincode,
    addr.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const buildEmployeeUpdatePayload = (module, data = {}) => {
  switch (module) {
    case "personal":
      return {
        ...data,
        personalMobile: data.personalMobile || data.mobile,
      };
    case "professional":
      return {
        ...data,
        designation: data.designation || data.jobTitle,
        dateJoining: data.dateJoining || data.dateJoined,
        officialEmail: data.officialEmail || data.workEmail,
        probationMonths: data.probationMonths ?? data.probationDuration,
      };
    case "bank":
      return {
        ...data,
        bankNameBranch: data.bankNameBranch || data.bankName,
        accountNumber: data.accountNumber || data.personalAccountNumber,
        ifscCode: data.ifscCode || data.personalIfsc,
      };
    case "payroll":
      return {
        ...data,
        pfApplicable: data.pfApplicable ?? data.pf,
        ptApplicable: data.ptApplicable ?? data.pt,
        esicApplicable: data.esicApplicable ?? data.esic,
        tdsApplicable: data.tdsApplicable ?? data.tds,
      };
    case "emergency":
      return {
        emergencyContacts: [data.emergencyContact1, data.emergencyContact2]
          .filter(Boolean)
          .map((contact) => ({
            name: contact.name || "",
            relationship: contact.relationship || "",
            phone: contact.phone || contact.mobile || "",
          })),
      };
    default:
      return data;
  }
};

const DetailCard = ({
  title,
  canEdit,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  children,
}) => (
  <div className="ed-card">
    <div className="ed-card-head">
      <h3 className="ed-card-title">{title}</h3>
      {canEdit && (
        <div className="ed-card-actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onSave}
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-icon"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
            >
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
    <div className="ed-field-value">{value || "N/A"}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="ed-detail-item">
    <span className="ed-meta-label">{label}</span>
    <span className="ed-meta-value">{value || "N/A"}</span>
  </div>
);

const EDIT_STEPS = [
  { id: "identity", label: "Basic Identity" },
  { id: "contact", label: "Contact" },
  { id: "government_id", label: "Government ID" },
  { id: "education", label: "Education" },
  { id: "employment", label: "Employment" },
  { id: "payroll", label: "Payroll" },
  { id: "documents", label: "Documents" },
];

const EDIT_STEP_INDEX = EDIT_STEPS.reduce((acc, step, index) => {
  acc[step.id] = index;
  return acc;
}, {});

const SECTION_TO_STEP = {
  identity: 0,
  contact: 1,
  government_id: 2,
  education: 3,
  employment: 4,
  payroll: 5,
};

const emptyContact = () => ({ name: "", relationship: "", phone: "" });

const emptyReference = () => ({ name: "", phone: "", email: "" });

const buildEditDraft = (employee = {}) => {
  const personal = employee.personal || {};
  const family = employee.family || {};
  const address = employee.address || {};
  const emergency = employee.emergency || {};
  const professional = employee.professional || {};
  const bank = employee.bank || {};
  const payroll = employee.payroll || {};

  return {
    identity: {
      fullName: personal.fullName || "",
      dob: toDateInputValue(personal.dob),
      gender: personal.gender || "",
      maritalStatus: family.maritalStatus || personal.maritalStatus || "",
      religion: personal.religion || "",
      physicallyHandicapped: personal.physicallyHandicapped || "",
      bloodGroup: personal.bloodGroup || "",
      fatherName: family.fatherName || "",
      motherName: family.motherName || "",
      spouseName: family.spouseName || "",
      marriageDate: toDateInputValue(family.marriageDate),
    },
    contact: {
      personalMobile: personal.personalMobile || personal.mobile || "",
      personalEmail: personal.personalEmail || "",
      sameAsCurrent: Boolean(address.sameAsCurrent),
      currentAddress: {
        street: address.currentAddress?.street || "",
        city: address.currentAddress?.city || "",
        state: address.currentAddress?.state || "",
        pincode: address.currentAddress?.pincode || "",
      },
      permanentAddress: {
        street: address.permanentAddress?.street || "",
        city: address.permanentAddress?.city || "",
        state: address.permanentAddress?.state || "",
        pincode: address.permanentAddress?.pincode || "",
      },
      emergencyContacts:
        emergency.emergencyContacts?.length > 0
          ? emergency.emergencyContacts.map((contact) => ({
              name: contact?.name || "",
              relationship: contact?.relationship || "",
              phone: contact?.phone || contact?.mobile || "",
            }))
          : [emptyContact()],
    },
    governmentId: {
      aadharNumber: bank.aadharNumber || "",
      panNumber: bank.panNumber || "",
      passportNumber: bank.passportNumber || "",
      drivingLicence: bank.drivingLicence || "",
      voterIdNumber: bank.voterIdNumber || "",
    },
    education: {
      highestQualification: personal.highestQualification || "",
      graduationYear: personal.graduationYear || "",
      instituteName: personal.instituteName || "",
      previousEmployer: personal.previousEmployer || "",
      references:
        family.references?.length > 0
          ? family.references.map((reference) => ({
              name: reference?.name || "",
              phone: reference?.phone || "",
              email: reference?.email || "",
            }))
          : [emptyReference()],
    },
    employment: {
      emp_code: employee.user?.emp_code || employee.emp_code || "",
      dateJoining: toDateInputValue(professional.dateJoining),
      employmentType: professional.employmentType || "",
      probationMonths: professional.probationMonths ?? "",
      confirmationDate: toDateInputValue(professional.confirmationDate),
      workLocation: professional.workLocation || "",
      designation: professional.jobTitle || professional.designation || "",
      department: professional.department || "",
      reportingManager: professional.reportingManager || "",
      officialEmail: professional.workEmail || professional.officialEmail || "",
      workMobile: professional.workMobile || "",
      laptopAssigned: professional.laptopAssigned || "",
      linkedinUrl: professional.linkedinUrl || "",
      attendanceBiometricId: professional.attendanceBiometricId || "",
      nameAsPerAadhaar: professional.nameAsPerAadhaar || "",
      inProbation: Boolean(professional.inProbation),
      probationDuration: professional.probationDuration || "",
    },
    payroll: {
      ctc: payroll.ctc || "",
      gross: payroll.gross || "",
      bankNameBranch: bank.bankNameBranch || bank.bankName || "",
      branch: bank.branch || "",
      accountHolderName: bank.accountHolderName || "",
      accountNumber: bank.accountNumber || bank.personalAccountNumber || "",
      ifscCode: bank.ifscCode || bank.personalIfsc || "",
      salaryAccountNumber: bank.salaryAccountNumber || "",
      salaryIfsc: bank.salaryIfsc || "",
      companyOpensBank: Boolean(bank.companyOpensBank),
      permissionToUsePanAadhar: Boolean(bank.permissionToUsePanAadhar),
      pfApplicable: Boolean(payroll.pfApplicable ?? payroll.pf),
      pfNumber: payroll.pfNumber || "",
      uanNumber: payroll.uanNumber || "",
      esicApplicable: Boolean(payroll.esicApplicable ?? payroll.esic),
      esicNumber: payroll.esicNumber || "",
      ptApplicable: Boolean(payroll.ptApplicable ?? payroll.pt),
      ptNumber: payroll.ptNumber || "",
      tdsRegime: payroll.tdsRegime || "",
      form12bb: payroll.form12bb || "",
    },
    documents: {
      personal_identity: null,
      onboarding: null,
      offboarding: null,
    },
  };
};

const getStepModules = (stepId, draft) => {
  switch (stepId) {
    case "identity":
      return [
        {
          module: "personal",
          data: {
            fullName: draft.identity.fullName,
            dob: draft.identity.dob,
            gender: draft.identity.gender,
            maritalStatus: draft.identity.maritalStatus,
            religion: draft.identity.religion,
            physicallyHandicapped: draft.identity.physicallyHandicapped,
            bloodGroup: draft.identity.bloodGroup,
          },
        },
        {
          module: "family",
          data: {
            fatherName: draft.identity.fatherName,
            motherName: draft.identity.motherName,
            maritalStatus: draft.identity.maritalStatus,
            spouseName: draft.identity.spouseName,
            marriageDate: draft.identity.marriageDate,
          },
        },
      ];
    case "contact":
      return [
        {
          module: "personal",
          data: {
            personalMobile: draft.contact.personalMobile,
            personalEmail: draft.contact.personalEmail,
          },
        },
        {
          module: "address",
          data: {
            sameAsCurrent: draft.contact.sameAsCurrent,
            currentAddress: draft.contact.currentAddress,
            permanentAddress: draft.contact.permanentAddress,
          },
        },
        {
          module: "emergency",
          data: {
            emergencyContacts: draft.contact.emergencyContacts,
          },
        },
      ];
    case "government_id":
      return [
        {
          module: "bank",
          data: {
            aadharNumber: draft.governmentId.aadharNumber,
            panNumber: draft.governmentId.panNumber,
            passportNumber: draft.governmentId.passportNumber,
            drivingLicence: draft.governmentId.drivingLicence,
            voterIdNumber: draft.governmentId.voterIdNumber,
          },
        },
      ];
    case "education":
      return [
        {
          module: "personal",
          data: {
            highestQualification: draft.education.highestQualification,
            graduationYear: draft.education.graduationYear,
            instituteName: draft.education.instituteName,
            previousEmployer: draft.education.previousEmployer,
          },
        },
        {
          module: "family",
          data: {
            references: draft.education.references,
          },
        },
      ];
    case "employment":
      return [
        {
          module: "professional",
          data: {
            emp_code: draft.employment.emp_code,
            dateJoined: draft.employment.dateJoining,
            employmentType: draft.employment.employmentType,
            probationMonths: draft.employment.probationMonths,
            confirmationDate: draft.employment.confirmationDate,
            workLocation: draft.employment.workLocation,
            jobTitle: draft.employment.designation,
            designation: draft.employment.designation,
            department: draft.employment.department,
            reportingManager: draft.employment.reportingManager,
            workEmail: draft.employment.officialEmail,
            officialEmail: draft.employment.officialEmail,
            workMobile: draft.employment.workMobile,
            laptopAssigned: draft.employment.laptopAssigned,
            linkedinUrl: draft.employment.linkedinUrl,
            attendanceBiometricId: draft.employment.attendanceBiometricId,
            nameAsPerAadhaar: draft.employment.nameAsPerAadhaar,
            inProbation: draft.employment.inProbation,
            probationDuration: draft.employment.probationDuration,
          },
        },
      ];
    case "payroll":
      return [
        {
          module: "bank",
          data: {
            bankNameBranch: draft.payroll.bankNameBranch,
            branch: draft.payroll.branch,
            accountHolderName: draft.payroll.accountHolderName,
            accountNumber: draft.payroll.accountNumber,
            ifscCode: draft.payroll.ifscCode,
            salaryAccountNumber: draft.payroll.salaryAccountNumber,
            salaryIfsc: draft.payroll.salaryIfsc,
            companyOpensBank: draft.payroll.companyOpensBank,
            permissionToUsePanAadhar: draft.payroll.permissionToUsePanAadhar,
          },
        },
        {
          module: "payroll",
          data: {
            ctc: draft.payroll.ctc,
            gross: draft.payroll.gross,
            pfApplicable: draft.payroll.pfApplicable,
            pfNumber: draft.payroll.pfNumber,
            uanNumber: draft.payroll.uanNumber,
            esicApplicable: draft.payroll.esicApplicable,
            esicNumber: draft.payroll.esicNumber,
            ptApplicable: draft.payroll.ptApplicable,
            ptNumber: draft.payroll.ptNumber,
            tdsRegime: draft.payroll.tdsRegime,
            form12bb: draft.payroll.form12bb,
          },
        },
      ];
    default:
      return [];
  }
};

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState({});
  const [referenceOptions, setReferenceOptions] = useState({
    departments: departmentOptions,
    designations: designationOptions,
    employmentTypes: employmentTypeOptions,
  });
  const [sensitiveDetails, setSensitiveDetails] = useState({
    bank: null,
    payroll: null,
    unlocked: false,
  });
  const [otpState, setOtpState] = useState({
    sending: false,
    verifying: false,
    requested: false,
    otp: "",
    message: "",
    error: "",
  });
  const [employeeDocuments, setEmployeeDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [editWizardStep, setEditWizardStep] = useState(0);
  const [editWizardDraft, setEditWizardDraft] = useState(null);
  const [editWizardSaving, setEditWizardSaving] = useState(false);
  const [editWizardError, setEditWizardError] = useState("");

  const fetchReferenceOptions = useCallback(async () => {
    try {
      const response = await axios.get("/admin/ref");
      setReferenceOptions({
        departments: response.data.departments || departmentOptions,
        designations: response.data.designations || designationOptions,
        employmentTypes: response.data.employmentTypes || employmentTypeOptions,
      });
    } catch (err) {
      console.warn("Failed to load reference options, using defaults.");
    }
  }, []);

  const fetchEmployeeData = useCallback(async () => {
    try {
      const response = await axios.get(`/employees/${id}`);
      const data = response.data;
      setEmployeeData(data);
      setFormData(data);
      setSensitiveDetails({ bank: null, payroll: null, unlocked: false });
      setOtpState({
        sending: false,
        verifying: false,
        requested: false,
        otp: "",
        message: "",
        error: "",
      });

      if (data.user?.emp_code) {
        setDocumentsLoading(true);
        setDocumentsError("");
        try {
          const docsResponse = await axios.get(
            `/documents/${data.user.emp_code}`,
          );
          setEmployeeDocuments(docsResponse.data || []);
        } catch (docErr) {
          setDocumentsError("Failed to load uploaded documents");
          setEmployeeDocuments([]);
        } finally {
          setDocumentsLoading(false);
        }
      }
    } catch (err) {
      setError("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const openEditWizard = useCallback(
    (stepIndex = 0) => {
      if (!employeeData) return;
      setEditWizardDraft(buildEditDraft(employeeData));
      setEditWizardStep(stepIndex);
      setEditWizardError("");
      setEditWizardOpen(true);
    },
    [employeeData],
  );

  const closeEditWizard = useCallback(() => {
    setEditWizardOpen(false);
    setEditWizardStep(0);
    setEditWizardError("");
    setEditWizardSaving(false);
  }, []);

  const updateWizardValue = useCallback((section, field, value) => {
    setEditWizardDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
    });
  }, []);

  const updateWizardNestedValue = useCallback((section, field, value) => {
    setEditWizardDraft((prev) => {
      if (!prev) return prev;
      const current = prev[section] || {};
      return {
        ...prev,
        [section]: {
          ...current,
          [field]: value,
        },
      };
    });
  }, []);

  const updateWizardNestedObjectValue = useCallback(
    (section, objectKey, field, value) => {
      setEditWizardDraft((prev) => {
        if (!prev) return prev;
        const currentSection = prev[section] || {};
        const currentObject = currentSection[objectKey] || {};
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [objectKey]: {
              ...currentObject,
              [field]: value,
            },
          },
        };
      });
    },
    [],
  );

  const updateWizardArrayItem = useCallback((section, index, field, value) => {
    setEditWizardDraft((prev) => {
      if (!prev) return prev;
      const currentSection = prev[section] || {};
      const items = Array.isArray(currentSection[field])
        ? [...currentSection[field]]
        : [];
      items[index] = { ...(items[index] || {}), ...value };
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: items,
        },
      };
    });
  }, []);

  const appendWizardArrayItem = useCallback((section, field, emptyItem) => {
    setEditWizardDraft((prev) => {
      if (!prev) return prev;
      const currentSection = prev[section] || {};
      const items = Array.isArray(currentSection[field])
        ? [...currentSection[field]]
        : [];
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: [...items, emptyItem()],
        },
      };
    });
  }, []);

  const removeWizardArrayItem = useCallback((section, field, index) => {
    setEditWizardDraft((prev) => {
      if (!prev) return prev;
      const currentSection = prev[section] || {};
      const items = Array.isArray(currentSection[field])
        ? currentSection[field].filter((_, itemIndex) => itemIndex !== index)
        : [];
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: items.length > 0 ? items : [field === "references" ? emptyReference() : emptyContact()],
        },
      };
    });
  }, []);

  const saveModuleUpdate = useCallback(
    async (module, data) => {
      const response = await axios.put(`/employees/${id}/edit`, {
        module,
        data: buildEmployeeUpdatePayload(module, data),
      });

      const updatedSection = response.data?.data;
      if (updatedSection) {
        setEmployeeData((prev) => ({
          ...prev,
          [module]: updatedSection,
        }));
        setFormData((prev) => ({
          ...prev,
          [module]: updatedSection,
        }));

        if (module === "bank" || module === "payroll") {
          setSensitiveDetails((prev) => ({
            ...prev,
            [module]: updatedSection,
            unlocked: true,
          }));
        }
      }
    },
    [id],
  );

  const saveEditWizardStep = useCallback(
    async (advance = true) => {
      if (!editWizardDraft) return;
      setEditWizardSaving(true);
      setEditWizardError("");

      try {
        const currentStep = EDIT_STEPS[editWizardStep];
        const modules = getStepModules(currentStep.id, editWizardDraft);

        for (const entry of modules) {
          await saveModuleUpdate(entry.module, entry.data);
        }

        if (currentStep.id === "documents") {
          const empCode = employeeData?.user?.emp_code || employeeData?.emp_code;
          if (empCode) {
            const files = Object.entries(editWizardDraft.documents || {}).filter(
              ([, file]) => file,
            );
            for (const [category, file] of files) {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("category", category);
              await axios.post(`/documents/upload/${empCode}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }
          }
        }

        await fetchEmployeeData();

        if (advance && editWizardStep < EDIT_STEPS.length - 1) {
          setEditWizardStep((prev) => prev + 1);
        } else if (currentStep.id === "documents") {
          closeEditWizard();
        }
      } catch (err) {
        setEditWizardError(
          err.response?.data?.message || "Failed to save employee details",
        );
      } finally {
        setEditWizardSaving(false);
      }
    },
    [closeEditWizard, editWizardDraft, editWizardStep, employeeData, fetchEmployeeData, saveModuleUpdate],
  );

  useEffect(() => {
    fetchEmployeeData();
    fetchReferenceOptions();
  }, [fetchEmployeeData, fetchReferenceOptions]);

  const getDocumentUrl = (document) => {
    if (!document?.filePath) return "#";
    const apiBase = axios.defaults.baseURL || "";
    const serverBase = apiBase.replace(/\/api\/?$/, "");
    const normalizedPath = String(document.filePath).replace(/\\/g, "/");
    return `${serverBase}/${normalizedPath}`;
  };

  const requestSensitiveOtp = async () => {
    setOtpState((prev) => ({ ...prev, sending: true, error: "", message: "" }));
    try {
      const response = await axios.post(`/employees/${id}/sensitive-otp`);
      setOtpState((prev) => ({
        ...prev,
        sending: false,
        requested: true,
        message: response.data?.message || "OTP sent to admin email",
        error: "",
      }));
    } catch (err) {
      setOtpState((prev) => ({
        ...prev,
        sending: false,
        error: err.response?.data?.message || "Failed to send OTP",
      }));
    }
  };

  const verifySensitiveOtp = async () => {
    if (!otpState.otp || otpState.otp.length !== 6) {
      setOtpState((prev) => ({ ...prev, error: "Enter the 6-digit OTP" }));
      return;
    }

    setOtpState((prev) => ({
      ...prev,
      verifying: true,
      error: "",
      message: "",
    }));
    try {
      const response = await axios.post(`/employees/${id}/sensitive-verify`, {
        otp: otpState.otp,
      });
      const unlocked = {
        bank: response.data?.bank || null,
        payroll: response.data?.payroll || null,
        unlocked: true,
      };
      setSensitiveDetails(unlocked);
      setEmployeeData((prev) => ({
        ...prev,
        bank: unlocked.bank,
        payroll: unlocked.payroll,
        sensitiveDetailsLocked: false,
      }));
      setFormData((prev) => ({
        ...prev,
        bank: unlocked.bank,
        payroll: unlocked.payroll,
      }));
      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        requested: false,
        otp: "",
        message: "Sensitive details unlocked",
        error: "",
      }));
    } catch (err) {
      setOtpState((prev) => ({
        ...prev,
        verifying: false,
        error: err.response?.data?.message || "Invalid OTP",
      }));
    }
  };

  const handleEdit = async (module) => {
    try {
      const response = await axios.put(`/employees/${id}/edit`, {
        module,
        data: buildEmployeeUpdatePayload(module, formData[module] || {}),
      });

      const updatedSection = response.data?.data;
      if (updatedSection) {
        setEmployeeData((prev) => ({
          ...prev,
          [module]: updatedSection,
        }));
        setFormData((prev) => ({
          ...prev,
          [module]: updatedSection,
        }));

        if (module === "bank" || module === "payroll") {
          setSensitiveDetails((prev) => ({
            ...prev,
            [module]: updatedSection,
            unlocked: true,
          }));
        }
      }

      setEditMode(null);
      if (module !== "bank" && module !== "payroll") {
        await fetchEmployeeData();
      }
      alert(`${module} details updated successfully`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update details");
    }
  };

  const handleInputChange = (module, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (module, parent, field, value) => {
    setFormData((prev) => {
      const currentModule = prev[module] || {};
      if (!parent) {
        return {
          ...prev,
          [module]: {
            ...currentModule,
            [field]: value,
          },
        };
      }

      return {
        ...prev,
        [module]: {
          ...currentModule,
          [parent]: {
            ...(currentModule[parent] || {}),
            [field]: value,
          },
        },
      };
    });
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
        <div className="alert alert-error">{error || "Employee not found"}</div>
      </div>
    );
  }

  const {
    user,
    personal,
    family,
    address,
    emergency,
    professional,
    bank,
    payroll,
  } = employeeData;
  const isPending = false;
  const canEdit = false;
  const normalizedStatus = user.status === "rejected" ? "rejected" : "approved";
  const displayName = personal?.fullName || "Employee Details";
  const workEmail = professional?.workEmail || user.email;
  const personalEmail = personal?.personalEmail || user.email;
  const unlockedBank = sensitiveDetails.bank || bank;
  const unlockedPayroll = sensitiveDetails.payroll || payroll;
  const hasBankDetails = employeeData.hasBankDetails || Boolean(unlockedBank);
  const hasPayrollDetails =
    employeeData.hasPayrollDetails || Boolean(unlockedPayroll);
  const completionPercentage = Number(employeeData.completionPercentage || 0);
  const missingSections = employeeData.missingSections || [];
  const sectionProgress = employeeData.sectionProgress || [];
  const missingDetails =
    employeeData.missingDetails ||
    sectionProgress
      .filter((section) => section.missingFields?.length)
      .map((section) => ({
        key: section.key,
        label: section.label,
        missingFields: section.missingFields,
      }));
  const missingTarget = resolveMissingSectionTarget(missingSections);

  const jumpToMissingDetails = () => {
    const stepIndex = SECTION_TO_STEP[missingTarget.edit || ""];
    openEditWizard(stepIndex ?? 0);
  };

  const renderSensitiveGate = (title, description) => (
    <DetailCard title={title} canEdit={false}>
      <div className="ed-sensitive-gate">
        <div className="ed-sensitive-icon">
          <i className="ti ti-lock" aria-hidden="true" />
        </div>
        <div className="ed-sensitive-copy">
          <h4>{description}</h4>
          <p>
            Send an OTP to the admin email and verify it to view these details.
          </p>
          {otpState.message && (
            <div className="ed-sensitive-success">{otpState.message}</div>
          )}
          {otpState.error && (
            <div className="ed-sensitive-error">{otpState.error}</div>
          )}
          <div className="ed-sensitive-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={requestSensitiveOtp}
              disabled={otpState.sending}
            >
              {otpState.sending ? "Sending..." : "Send OTP"}
            </button>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              value={otpState.otp}
              onChange={(e) =>
                setOtpState((prev) => ({
                  ...prev,
                  otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                  error: "",
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
              {otpState.verifying ? "Verifying..." : "Verify"}
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
          isEditing={editMode === "personal"}
          onEdit={() => startEdit("personal")}
          onSave={() => handleEdit("personal")}
          onCancel={cancelEdit}
        >
          {editMode === "personal" ? (
            <div className="grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.personal?.fullName || ""}
                  onChange={(e) =>
                    handleInputChange("personal", "fullName", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={formData.personal?.gender || ""}
                  onChange={(e) =>
                    handleInputChange("personal", "gender", e.target.value)
                  }
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
                  value={toDateInputValue(formData.personal?.dob)}
                  onChange={(e) =>
                    handleInputChange("personal", "dob", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="text"
                  value={formData.personal?.mobile || ""}
                  onChange={(e) =>
                    handleInputChange("personal", "mobile", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <input
                  type="text"
                  value={formData.personal?.bloodGroup || ""}
                  onChange={(e) =>
                    handleInputChange("personal", "bloodGroup", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={formData.personal?.bloodGroup || ""}
                  onChange={(e) =>
                    handleInputChange("personal", "bloodGroup", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  value={formData.personal?.personalEmail || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "personal",
                      "personalEmail",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="ed-basic">
              <div className="ed-basic-main">
                <div className="ed-basic-name">{personal.fullName}</div>
                <div className="ed-basic-id">{user.emp_code || user.id}</div>
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
                  <span className="ed-meta-value">
                    {formatDate(personal.dob)}
                  </span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Age</span>
                  <span className="ed-meta-value">
                    {personal.age != null ? `${personal.age} years` : "N/A"}
                  </span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Blood type</span>
                  <span className="ed-meta-value">
                    {personal.bloodGroup || "N/A"}
                  </span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Marital status</span>
                  <span className="ed-meta-value">
                    {family?.maritalStatus || "N/A"}
                  </span>
                </div>
                <div className="ed-meta-row">
                  <span className="ed-meta-label">Status</span>
                  <span className="ed-meta-value">
                    <span className={`badge badge-${normalizedStatus}`}>
                      {normalizedStatus === "approved" ? "Active" : "Rejected"}
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
            isEditing={editMode === "address"}
            onEdit={() => startEdit("address")}
            onSave={() => handleEdit("address")}
            onCancel={cancelEdit}
          >
            {editMode === "address" ? (
              <>
                <h4 className="ed-subsection-title">Current address</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.street || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "currentAddress",
                          "street",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.city || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "currentAddress",
                          "city",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.state || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "currentAddress",
                          "state",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.pincode || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "currentAddress",
                          "pincode",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.address?.currentAddress?.country || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "currentAddress",
                          "country",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
                <h4 className="ed-subsection-title">Permanent address</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.street || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "permanentAddress",
                          "street",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.city || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "permanentAddress",
                          "city",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.state || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "permanentAddress",
                          "state",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.pincode || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "permanentAddress",
                          "pincode",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={formData.address?.permanentAddress?.country || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "address",
                          "permanentAddress",
                          "country",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Current address"
                  value={formatAddress(address.currentAddress)}
                />
                <Field
                  label="Permanent address"
                  value={formatAddress(address.permanentAddress)}
                />
              </>
            )}
          </DetailCard>
        )}

        {emergency && (
          <DetailCard
            title="Emergency contact"
            canEdit={canEdit}
            isEditing={editMode === "emergency"}
            onEdit={() => startEdit("emergency")}
            onSave={() => handleEdit("emergency")}
            onCancel={cancelEdit}
          >
            {editMode === "emergency" ? (
              <>
                <h4 className="ed-subsection-title">Primary contact</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact1?.name || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact1",
                          "name",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      value={
                        formData.emergency?.emergencyContact1?.relationship ||
                        ""
                      }
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact1",
                          "relationship",
                          e.target.value,
                        )
                      }
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
                      value={
                        formData.emergency?.emergencyContact1?.mobile || ""
                      }
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact1",
                          "mobile",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
                <h4 className="ed-subsection-title">Secondary contact</h4>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.emergency?.emergencyContact2?.name || ""}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact2",
                          "name",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      value={
                        formData.emergency?.emergencyContact2?.relationship ||
                        ""
                      }
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact2",
                          "relationship",
                          e.target.value,
                        )
                      }
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
                      value={
                        formData.emergency?.emergencyContact2?.mobile || ""
                      }
                      onChange={(e) =>
                        handleNestedInputChange(
                          "emergency",
                          "emergencyContact2",
                          "mobile",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <Field label="Name" value={emergency.emergencyContact1?.name} />
                <Field
                  label="Relationship"
                  value={emergency.emergencyContact1?.relationship}
                />
                <Field
                  label="Phone number"
                  value={emergency.emergencyContact1?.mobile}
                />
                {emergency.emergencyContact2?.name && (
                  <>
                    <h4 className="ed-subsection-title">Secondary contact</h4>
                    <Field
                      label="Name"
                      value={emergency.emergencyContact2.name}
                    />
                    <Field
                      label="Relationship"
                      value={emergency.emergencyContact2.relationship}
                    />
                    <Field
                      label="Phone number"
                      value={emergency.emergencyContact2.mobile}
                    />
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
          isEditing={editMode === "family"}
          onEdit={() => startEdit("family")}
          onSave={() => handleEdit("family")}
          onCancel={cancelEdit}
        >
          {editMode === "family" ? (
            <div className="grid-2">
              <div className="form-group">
                <label>Father&apos;s Name</label>
                <input
                  type="text"
                  value={formData.family?.fatherName || ""}
                  onChange={(e) =>
                    handleInputChange("family", "fatherName", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Mother&apos;s Name</label>
                <input
                  type="text"
                  value={formData.family?.motherName || ""}
                  onChange={(e) =>
                    handleInputChange("family", "motherName", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Marital Status</label>
                <select
                  value={formData.family?.maritalStatus || "Single"}
                  onChange={(e) =>
                    handleInputChange("family", "maritalStatus", e.target.value)
                  }
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
              {formData.family?.maritalStatus === "Married" && (
                <>
                  <div className="form-group">
                    <label>Spouse Name</label>
                    <input
                      type="text"
                      value={formData.family?.spouseName || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "family",
                          "spouseName",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Marriage Date</label>
                    <input
                      type="date"
                      value={toDateInputValue(formData.family?.marriageDate)}
                      onChange={(e) =>
                        handleInputChange(
                          "family",
                          "marriageDate",
                          e.target.value,
                        )
                      }
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
                  {family.maritalStatus === "Married" && family.spouseName && (
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
          isEditing={editMode === "professional"}
          onEdit={() => startEdit("professional")}
          onSave={() => handleEdit("professional")}
          onCancel={cancelEdit}
        >
          {editMode === "professional" ? (
            <div className="grid-2">
              <div className="form-group">
                <label>Department</label>
                <select
                  value={formData.professional?.department || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "department",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Select Department</option>
                  {referenceOptions.departments.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Designation</label>
                <select
                  value={formData.professional?.jobTitle || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "jobTitle",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Select Designation</option>
                  {referenceOptions.designations.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Employment Type</label>
                <select
                  value={formData.professional?.employmentType || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "employmentType",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Select Employment Type</option>
                  {referenceOptions.employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date Joined</label>
                <input
                  type="date"
                  value={toDateInputValue(formData.professional?.dateJoined)}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "dateJoined",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Reporting Manager</label>
                <input
                  type="text"
                  value={formData.professional?.reportingManager || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "reportingManager",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  value={formData.professional?.workEmail || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "workEmail",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.professional?.linkedinUrl || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "linkedinUrl",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Biometric ID</label>
                <input
                  type="text"
                  value={formData.professional?.attendanceBiometricId || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "attendanceBiometricId",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Name as per Aadhaar</label>
                <input
                  type="text"
                  value={formData.professional?.nameAsPerAadhaar || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "professional",
                      "nameAsPerAadhaar",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <div
                  style={{
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <label className="checkbox-label" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.professional?.inProbation || false}
                      onChange={(e) =>
                        handleInputChange(
                          "professional",
                          "inProbation",
                          e.target.checked,
                        )
                      }
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
                    value={formData.professional?.probationDuration || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "professional",
                        "probationDuration",
                        e.target.value,
                      )
                    }
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="ed-detail-grid">
              <DetailItem label="Employee code" value={user.emp_code} />
              <DetailItem label="Department" value={professional.department} />
              <DetailItem label="Job title" value={professional.jobTitle} />
              <DetailItem
                label="Employment type"
                value={professional.employmentType}
              />
              <DetailItem
                label="Date joined"
                value={formatDate(professional.dateJoined)}
              />
              <DetailItem
                label="Reporting manager"
                value={professional.reportingManager}
              />
              <DetailItem label="Work email" value={workEmail} />
              <DetailItem
                label="Biometric ID"
                value={professional.attendanceBiometricId}
              />
              {professional.linkedinUrl && (
                <DetailItem
                  label="LinkedIn"
                  value={
                    <a
                      href={professional.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View profile
                    </a>
                  }
                />
              )}
              {professional.nameAsPerAadhaar && (
                <DetailItem
                  label="Name as per Aadhaar"
                  value={professional.nameAsPerAadhaar}
                />
              )}
              <DetailItem
                label="Probation status"
                value={
                  professional.inProbation
                    ? `In probation (${professional.probationDuration ? `${professional.probationDuration} month(s)` : "duration not set"})`
                    : "Confirmed"
                }
              />
            </div>
          )}
        </DetailCard>
      ) : (
        <div className="ed-empty-tab">
          No professional details available yet. Use the fill-details action
          above to complete this profile.
        </div>
      )}

      {!isPending &&
        hasBankDetails &&
        !unlockedBank &&
        renderSensitiveGate("Bank details", "Bank details are protected")}

      {!isPending && unlockedBank && (
        <DetailCard
          title="Bank details"
          canEdit={canEdit}
          isEditing={editMode === "bank"}
          onEdit={() => startEdit("bank")}
          onSave={() => handleEdit("bank")}
          onCancel={cancelEdit}
        >
          {editMode === "bank" ? (
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label
                  className="checkbox-label"
                  style={{ textTransform: "none" }}
                >
                  <input
                    type="checkbox"
                    checked={formData.bank?.companyOpensBank || false}
                    onChange={(e) =>
                      handleInputChange(
                        "bank",
                        "companyOpensBank",
                        e.target.checked,
                      )
                    }
                  />
                  Company open bank account
                </label>
              </div>
              <div className="form-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  value={formData.bank?.panNumber || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "panNumber", e.target.value)
                  }
                  style={{ textTransform: "uppercase" }}
                  maxLength="10"
                />
              </div>
              <div className="form-group">
                <label>Aadhar Number</label>
                <input
                  type="text"
                  value={formData.bank?.aadharNumber || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "aadharNumber", e.target.value)
                  }
                  maxLength="12"
                />
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label
                  className="checkbox-label"
                  style={{ textTransform: "none" }}
                >
                  <input
                    type="checkbox"
                    checked={formData.bank?.permissionToUsePanAadhar || false}
                    onChange={(e) =>
                      handleInputChange(
                        "bank",
                        "permissionToUsePanAadhar",
                        e.target.checked,
                      )
                    }
                  />
                  Permission granted to use PAN and Aadhar
                </label>
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={formData.bank?.bankName || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "bankName", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input
                  type="text"
                  value={formData.bank?.branch || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "branch", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Personal Account Number</label>
                <input
                  type="text"
                  value={formData.bank?.personalAccountNumber || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "bank",
                      "personalAccountNumber",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Personal IFSC Code</label>
                <input
                  type="text"
                  value={formData.bank?.personalIfsc || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "personalIfsc", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Salary Account Number</label>
                <input
                  type="text"
                  value={formData.bank?.salaryAccountNumber || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "bank",
                      "salaryAccountNumber",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Salary IFSC Code</label>
                <input
                  type="text"
                  value={formData.bank?.salaryIfsc || ""}
                  onChange={(e) =>
                    handleInputChange("bank", "salaryIfsc", e.target.value)
                  }
                />
              </div>
            </div>
          ) : (
            <div className="ed-detail-grid">
              <DetailItem
                label="Company opens bank"
                value={unlockedBank.companyOpensBank ? "Yes" : "No"}
              />
              <DetailItem label="PAN number" value={unlockedBank.panNumber} />
              <DetailItem
                label="Aadhar number"
                value={unlockedBank.aadharNumber}
              />
              <DetailItem
                label="Permission granted"
                value={unlockedBank.permissionToUsePanAadhar ? "Yes" : "No"}
              />
              <DetailItem label="Bank name" value={unlockedBank.bankName} />
              <DetailItem
                label="Account holder"
                value={unlockedBank.accountHolderName}
              />
              <DetailItem label="Branch" value={unlockedBank.branch} />
              <DetailItem
                label="Personal account"
                value={unlockedBank.personalAccountNumber}
              />
              <DetailItem
                label="Personal IFSC"
                value={unlockedBank.personalIfsc}
              />
              <DetailItem
                label="Salary account"
                value={unlockedBank.salaryAccountNumber}
              />
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
        renderSensitiveGate(
          "Payroll information",
          "Payroll details are protected",
        )
      ) : !isPending && unlockedPayroll ? (
        <DetailCard
          title="Payroll information"
          canEdit={canEdit}
          isEditing={editMode === "payroll"}
          onEdit={() => startEdit("payroll")}
          onSave={() => handleEdit("payroll")}
          onCancel={cancelEdit}
        >
          {editMode === "payroll" ? (
            <div className="ed-form-grid">
              <div className="ed-field">
                <label className="ed-label">CTC</label>
                <input
                  type="number"
                  className="ed-input"
                  value={formData.payroll?.ctc || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "ctc",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="ed-field">
                <label className="ed-label">Gross salary</label>
                <input
                  type="number"
                  className="ed-input"
                  value={formData.payroll?.gross || ""}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "gross",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div
                className="ed-field"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={formData.payroll?.pf || false}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "pf",
                      e.target.checked,
                    )
                  }
                />
                <label className="ed-label" style={{ margin: 0 }}>
                  PF Applicable
                </label>
              </div>
              <div
                className="ed-field"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={formData.payroll?.pt || false}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "pt",
                      e.target.checked,
                    )
                  }
                />
                <label className="ed-label" style={{ margin: 0 }}>
                  PT Applicable
                </label>
              </div>
              <div
                className="ed-field"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={formData.payroll?.esic || false}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "esic",
                      e.target.checked,
                    )
                  }
                />
                <label className="ed-label" style={{ margin: 0 }}>
                  ESIC Applicable
                </label>
              </div>
              <div
                className="ed-field"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={formData.payroll?.tds || false}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "payroll",
                      null,
                      "tds",
                      e.target.checked,
                    )
                  }
                />
                <label className="ed-label" style={{ margin: 0 }}>
                  TDS Applicable
                </label>
              </div>
            </div>
          ) : (
            <div className="ed-detail-grid">
              <DetailItem
                label="CTC"
                value={
                  (unlockedPayroll || {}).ctc
                    ? `₹${(unlockedPayroll || {}).ctc.toLocaleString("en-IN")}`
                    : "N/A"
                }
              />
              <DetailItem
                label="Gross salary"
                value={
                  (unlockedPayroll || {}).gross
                    ? `₹${(unlockedPayroll || {}).gross.toLocaleString("en-IN")}`
                    : "N/A"
                }
              />
              <DetailItem
                label="PF"
                value={(unlockedPayroll || {}).pf ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="PT"
                value={(unlockedPayroll || {}).pt ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="ESIC"
                value={(unlockedPayroll || {}).esic ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="TDS"
                value={(unlockedPayroll || {}).tds ? "Applicable" : "Not applicable"}
              />
            </div>
          )}
        </DetailCard>
      ) : (
        <div className="ed-empty-tab">
          {isPending
            ? "Payroll details will be available after approval."
            : "No payroll details available."}
        </div>
      )}
    </>
  );

  const renderPayrollHistoryTab = () => {
    if (isPending) {
      return (
        <div className="ed-empty-tab">
          Payroll history will be available after approval.
        </div>
      );
    }
    if (!hasPayrollDetails) {
      return <div className="ed-empty-tab">No payroll history available.</div>;
    }
    if (!unlockedPayroll) {
      return renderSensitiveGate(
        "Payroll history",
        "Payroll history is protected",
      );
    }

    const history = unlockedPayroll.history || [];

    if (history.length === 0) {
      return <div className="ed-empty-tab">No payroll history available.</div>;
    }

    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );

    return (
      <div className="ed-timeline" style={{ marginTop: "20px" }}>
        {sortedHistory.map((entry, index) => (
          <div
            key={index}
            className="ed-timeline-item"
            style={{
              borderLeft: "2px solid var(--color-primary)",
              paddingLeft: "16px",
              position: "relative",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "-6px",
                top: "0",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--color-primary)",
              }}
            ></div>
            <div
              style={{
                fontSize: "var(--font-sm)",
                color: "var(--color-text-muted)",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              {new Date(entry.updatedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              <span style={{ textTransform: "capitalize" }}>
                {entry.changeType || "Updated"}
              </span>
            </div>
            <div
              className="ed-detail-grid"
              style={{
                background: "var(--color-bg-secondary)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
              }}
            >
              <DetailItem
                label="CTC"
                value={
                  entry.ctc ? `₹${entry.ctc.toLocaleString("en-IN")}` : "N/A"
                }
              />
              <DetailItem
                label="Gross salary"
                value={
                  entry.gross
                    ? `₹${entry.gross.toLocaleString("en-IN")}`
                    : "N/A"
                }
              />
              <DetailItem
                label="PF"
                value={entry.pf ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="PT"
                value={entry.pt ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="ESIC"
                value={entry.esic ? "Applicable" : "Not applicable"}
              />
              <DetailItem
                label="TDS"
                value={entry.tds ? "Applicable" : "Not applicable"}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEditWizardStep = () => {
    if (!editWizardDraft) return null;

    switch (editWizardStep) {
      case 0:
        return (
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={editWizardDraft.identity.fullName}
                onChange={(e) =>
                  updateWizardValue("identity", "fullName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={editWizardDraft.identity.dob}
                onChange={(e) =>
                  updateWizardValue("identity", "dob", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select
                value={editWizardDraft.identity.gender}
                onChange={(e) =>
                  updateWizardValue("identity", "gender", e.target.value)
                }
              >
                <option value="">Select gender</option>
                {(referenceOptions.genders || ["Male", "Female", "Other"]).map(
                  (gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Marital Status</label>
              <select
                value={editWizardDraft.identity.maritalStatus}
                onChange={(e) =>
                  updateWizardValue(
                    "identity",
                    "maritalStatus",
                    e.target.value,
                  )
                }
              >
                <option value="">Select status</option>
                {(referenceOptions.maritalStatuses || [
                  "Single",
                  "Married",
                  "Divorced",
                  "Engaged",
                ]).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Religion</label>
              <input
                type="text"
                value={editWizardDraft.identity.religion}
                onChange={(e) =>
                  updateWizardValue("identity", "religion", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Physically Handicapped</label>
              <select
                value={editWizardDraft.identity.physicallyHandicapped}
                onChange={(e) =>
                  updateWizardValue(
                    "identity",
                    "physicallyHandicapped",
                    e.target.value,
                  )
                }
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <select
                value={editWizardDraft.identity.bloodGroup}
                onChange={(e) =>
                  updateWizardValue("identity", "bloodGroup", e.target.value)
                }
              >
                <option value="">Select group</option>
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
            <div className="form-group">
              <label>Father&apos;s Name</label>
              <input
                type="text"
                value={editWizardDraft.identity.fatherName}
                onChange={(e) =>
                  updateWizardValue("identity", "fatherName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Mother&apos;s Name</label>
              <input
                type="text"
                value={editWizardDraft.identity.motherName}
                onChange={(e) =>
                  updateWizardValue("identity", "motherName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Spouse Name</label>
              <input
                type="text"
                value={editWizardDraft.identity.spouseName}
                onChange={(e) =>
                  updateWizardValue("identity", "spouseName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Marriage Date</label>
              <input
                type="date"
                value={editWizardDraft.identity.marriageDate}
                onChange={(e) =>
                  updateWizardValue("identity", "marriageDate", e.target.value)
                }
              />
            </div>
          </div>
        );
      case 1:
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Personal Mobile</label>
                <input
                  type="text"
                  value={editWizardDraft.contact.personalMobile}
                  onChange={(e) =>
                    updateWizardValue(
                      "contact",
                      "personalMobile",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Personal Email</label>
                <input
                  type="email"
                  value={editWizardDraft.contact.personalEmail}
                  onChange={(e) =>
                    updateWizardValue(
                      "contact",
                      "personalEmail",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="ed-subsection-title">Current address</div>
            <div className="grid-2">
              <div className="form-group">
                <label>Street</label>
                <input
                  type="text"
                  value={editWizardDraft.contact.currentAddress.street}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "street",
                      value,
                    );
                    if (editWizardDraft.contact.sameAsCurrent) {
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "street",
                        value,
                      );
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={editWizardDraft.contact.currentAddress.city}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "city",
                      value,
                    );
                    if (editWizardDraft.contact.sameAsCurrent) {
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "city",
                        value,
                      );
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={editWizardDraft.contact.currentAddress.state}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "state",
                      value,
                    );
                    if (editWizardDraft.contact.sameAsCurrent) {
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "state",
                        value,
                      );
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={editWizardDraft.contact.currentAddress.pincode}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "pincode",
                      value,
                    );
                    if (editWizardDraft.contact.sameAsCurrent) {
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "pincode",
                        value,
                      );
                    }
                  }}
                />
              </div>
            </div>

            <label className="checkbox-label" style={{ margin: "8px 0 16px" }}>
              <input
                type="checkbox"
                checked={editWizardDraft.contact.sameAsCurrent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditWizardDraft((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      contact: {
                        ...prev.contact,
                        sameAsCurrent: checked,
                        permanentAddress: checked
                          ? { ...prev.contact.currentAddress }
                          : prev.contact.permanentAddress,
                      },
                    };
                  });
                }}
              />
              Permanent address same as current address
            </label>

            {!editWizardDraft.contact.sameAsCurrent && (
              <>
                <div className="ed-subsection-title">Permanent address</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Street</label>
                    <input
                      type="text"
                      value={editWizardDraft.contact.permanentAddress.street}
                      onChange={(e) =>
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "street",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={editWizardDraft.contact.permanentAddress.city}
                      onChange={(e) =>
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "city",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={editWizardDraft.contact.permanentAddress.state}
                      onChange={(e) =>
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "state",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={editWizardDraft.contact.permanentAddress.pincode}
                      onChange={(e) =>
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "pincode",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="ed-subsection-title">Emergency contacts</div>
            {editWizardDraft.contact.emergencyContacts.map((contact, index) => (
              <div key={index} className="ed-dyn-item" style={{ marginBottom: 16 }}>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => {
                        const next = [...editWizardDraft.contact.emergencyContacts];
                        next[index] = { ...next[index], name: e.target.value };
                        updateWizardValue("contact", "emergencyContacts", next);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Relationship</label>
                    <select
                      value={contact.relationship}
                      onChange={(e) => {
                        const next = [...editWizardDraft.contact.emergencyContacts];
                        next[index] = {
                          ...next[index],
                          relationship: e.target.value,
                        };
                        updateWizardValue("contact", "emergencyContacts", next);
                      }}
                    >
                      <option value="">Select relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) => {
                        const next = [...editWizardDraft.contact.emergencyContacts];
                        next[index] = { ...next[index], phone: e.target.value };
                        updateWizardValue("contact", "emergencyContacts", next);
                      }}
                    />
                  </div>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      removeWizardArrayItem(
                        "contact",
                        "emergencyContacts",
                        index,
                      )
                    }
                  >
                    Remove contact
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                appendWizardArrayItem("contact", "emergencyContacts", emptyContact)
              }
            >
              Add another emergency contact
            </button>
          </>
        );
      case 2:
        return (
          <div className="grid-2">
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input
                type="text"
                value={editWizardDraft.governmentId.aadharNumber}
                onChange={(e) =>
                  updateWizardValue(
                    "governmentId",
                    "aadharNumber",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>PAN Number</label>
              <input
                type="text"
                value={editWizardDraft.governmentId.panNumber}
                onChange={(e) =>
                  updateWizardValue(
                    "governmentId",
                    "panNumber",
                    e.target.value.toUpperCase(),
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Passport Number</label>
              <input
                type="text"
                value={editWizardDraft.governmentId.passportNumber}
                onChange={(e) =>
                  updateWizardValue(
                    "governmentId",
                    "passportNumber",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Driving Licence</label>
              <input
                type="text"
                value={editWizardDraft.governmentId.drivingLicence}
                onChange={(e) =>
                  updateWizardValue(
                    "governmentId",
                    "drivingLicence",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Voter ID Number</label>
              <input
                type="text"
                value={editWizardDraft.governmentId.voterIdNumber}
                onChange={(e) =>
                  updateWizardValue(
                    "governmentId",
                    "voterIdNumber",
                    e.target.value,
                  )
                }
              />
            </div>
          </div>
        );
      case 3:
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>Highest Qualification</label>
                <input
                  type="text"
                  value={editWizardDraft.education.highestQualification}
                  onChange={(e) =>
                    updateWizardValue(
                      "education",
                      "highestQualification",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Graduation Year</label>
                <select
                  value={editWizardDraft.education.graduationYear}
                  onChange={(e) =>
                    updateWizardValue(
                      "education",
                      "graduationYear",
                      e.target.value,
                    )
                  }
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 30 }, (_, index) => new Date().getFullYear() - index).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Institute / University</label>
                <input
                  type="text"
                  value={editWizardDraft.education.instituteName}
                  onChange={(e) =>
                    updateWizardValue("education", "instituteName", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Previous Employer</label>
                <input
                  type="text"
                  value={editWizardDraft.education.previousEmployer}
                  onChange={(e) =>
                    updateWizardValue(
                      "education",
                      "previousEmployer",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="ed-subsection-title">Reference contacts</div>
            {editWizardDraft.education.references.map((reference, index) => (
              <div key={index} className="ed-dyn-item" style={{ marginBottom: 16 }}>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={reference.name}
                      onChange={(e) => {
                        const next = [...editWizardDraft.education.references];
                        next[index] = { ...next[index], name: e.target.value };
                        updateWizardValue("education", "references", next);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={reference.phone}
                      onChange={(e) => {
                        const next = [...editWizardDraft.education.references];
                        next[index] = { ...next[index], phone: e.target.value };
                        updateWizardValue("education", "references", next);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={reference.email}
                      onChange={(e) => {
                        const next = [...editWizardDraft.education.references];
                        next[index] = { ...next[index], email: e.target.value };
                        updateWizardValue("education", "references", next);
                      }}
                    />
                  </div>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      removeWizardArrayItem("education", "references", index)
                    }
                  >
                    Remove reference
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                appendWizardArrayItem("education", "references", emptyReference)
              }
            >
              Add another reference
            </button>
          </>
        );
      case 4:
        return (
          <div className="grid-2">
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                value={editWizardDraft.employment.emp_code}
                onChange={(e) =>
                  updateWizardValue("employment", "emp_code", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Date of Joining</label>
              <input
                type="date"
                value={editWizardDraft.employment.dateJoining}
                onChange={(e) =>
                  updateWizardValue("employment", "dateJoining", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select
                value={editWizardDraft.employment.employmentType}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "employmentType",
                    e.target.value,
                  )
                }
              >
                <option value="">Select type</option>
                {(referenceOptions.employmentTypes || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Probation Months</label>
              <input
                type="number"
                min="0"
                max="24"
                value={editWizardDraft.employment.probationMonths}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "probationMonths",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Confirmation Date</label>
              <input
                type="date"
                value={editWizardDraft.employment.confirmationDate}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "confirmationDate",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Work Location</label>
              <select
                value={editWizardDraft.employment.workLocation}
                onChange={(e) =>
                  updateWizardValue("employment", "workLocation", e.target.value)
                }
              >
                <option value="">Select location</option>
                {(referenceOptions.workLocations || ["Office", "Remote", "Hybrid"]).map(
                  (location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select
                value={editWizardDraft.employment.designation}
                onChange={(e) =>
                  updateWizardValue("employment", "designation", e.target.value)
                }
              >
                <option value="">Select designation</option>
                {(referenceOptions.designations || []).map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select
                value={editWizardDraft.employment.department}
                onChange={(e) =>
                  updateWizardValue("employment", "department", e.target.value)
                }
              >
                <option value="">Select department</option>
                {(referenceOptions.departments || []).map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reporting Manager</label>
              <input
                type="text"
                value={editWizardDraft.employment.reportingManager}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "reportingManager",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Official Email</label>
              <input
                type="email"
                value={editWizardDraft.employment.officialEmail}
                onChange={(e) =>
                  updateWizardValue("employment", "officialEmail", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Work Mobile</label>
              <input
                type="text"
                value={editWizardDraft.employment.workMobile}
                onChange={(e) =>
                  updateWizardValue("employment", "workMobile", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Laptop Assigned</label>
              <input
                type="text"
                value={editWizardDraft.employment.laptopAssigned}
                onChange={(e) =>
                  updateWizardValue("employment", "laptopAssigned", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                value={editWizardDraft.employment.linkedinUrl}
                onChange={(e) =>
                  updateWizardValue("employment", "linkedinUrl", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Biometric ID</label>
              <input
                type="text"
                value={editWizardDraft.employment.attendanceBiometricId}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "attendanceBiometricId",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>Name as per Aadhaar</label>
              <input
                type="text"
                value={editWizardDraft.employment.nameAsPerAadhaar}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "nameAsPerAadhaar",
                    e.target.value,
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>In Probation</label>
              <select
                value={editWizardDraft.employment.inProbation ? "yes" : "no"}
                onChange={(e) =>
                  updateWizardValue(
                    "employment",
                    "inProbation",
                    e.target.value === "yes",
                  )
                }
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            {editWizardDraft.employment.inProbation && (
              <div className="form-group">
                <label>Probation Duration</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={editWizardDraft.employment.probationDuration}
                  onChange={(e) =>
                    updateWizardValue(
                      "employment",
                      "probationDuration",
                      e.target.value,
                    )
                  }
                />
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label>CTC</label>
                <input
                  type="number"
                  value={editWizardDraft.payroll.ctc}
                  onChange={(e) =>
                    updateWizardValue("payroll", "ctc", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Gross Salary</label>
                <input
                  type="number"
                  value={editWizardDraft.payroll.gross}
                  onChange={(e) =>
                    updateWizardValue("payroll", "gross", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Company open bank account</label>
                <select
                  value={editWizardDraft.payroll.companyOpensBank ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "companyOpensBank",
                      e.target.value === "yes",
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Permission to use PAN and Aadhaar</label>
                <select
                  value={editWizardDraft.payroll.permissionToUsePanAadhar ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "permissionToUsePanAadhar",
                      e.target.value === "yes",
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bank Name & Branch</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.bankNameBranch}
                  onChange={(e) =>
                    updateWizardValue("payroll", "bankNameBranch", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.branch}
                  onChange={(e) =>
                    updateWizardValue("payroll", "branch", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.accountHolderName}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "accountHolderName",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.accountNumber}
                  onChange={(e) =>
                    updateWizardValue("payroll", "accountNumber", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.ifscCode}
                  onChange={(e) =>
                    updateWizardValue("payroll", "ifscCode", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="form-group">
                <label>Salary Account Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.salaryAccountNumber}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "salaryAccountNumber",
                      e.target.value,
                    )
                  }
                />
              </div>
              <div className="form-group">
                <label>Salary IFSC</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.salaryIfsc}
                  onChange={(e) =>
                    updateWizardValue("payroll", "salaryIfsc", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>PF Applicable</label>
                <select
                  value={editWizardDraft.payroll.pfApplicable ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue("payroll", "pfApplicable", e.target.value === "yes")
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>PF Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.pfNumber}
                  onChange={(e) =>
                    updateWizardValue("payroll", "pfNumber", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>UAN Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.uanNumber}
                  onChange={(e) =>
                    updateWizardValue("payroll", "uanNumber", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>ESIC Applicable</label>
                <select
                  value={editWizardDraft.payroll.esicApplicable ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "esicApplicable",
                      e.target.value === "yes",
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>ESIC Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.esicNumber}
                  onChange={(e) =>
                    updateWizardValue("payroll", "esicNumber", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>PT Applicable</label>
                <select
                  value={editWizardDraft.payroll.ptApplicable ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "ptApplicable",
                      e.target.value === "yes",
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>PT Number</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.ptNumber}
                  onChange={(e) =>
                    updateWizardValue("payroll", "ptNumber", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>TDS Regime</label>
                <select
                  value={editWizardDraft.payroll.tdsRegime}
                  onChange={(e) =>
                    updateWizardValue("payroll", "tdsRegime", e.target.value)
                  }
                >
                  <option value="">Select regime</option>
                  <option value="Old Tax Regime">Old Tax Regime</option>
                  <option value="New Tax Regime">New Tax Regime</option>
                </select>
              </div>
              <div className="form-group">
                <label>Form 12BB</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.form12bb}
                  onChange={(e) =>
                    updateWizardValue("payroll", "form12bb", e.target.value)
                  }
                />
              </div>
            </div>
          </>
        );
      case 6:
        return (
          <div className="grid-2">
            <div className="form-group">
              <label>Personal identity document</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) =>
                  updateWizardValue(
                    "documents",
                    "personal_identity",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {editWizardDraft.documents.personal_identity && (
                <small>Selected: {editWizardDraft.documents.personal_identity.name}</small>
              )}
            </div>
            <div className="form-group">
              <label>Onboarding document</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) =>
                  updateWizardValue(
                    "documents",
                    "onboarding",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {editWizardDraft.documents.onboarding && (
                <small>Selected: {editWizardDraft.documents.onboarding.name}</small>
              )}
            </div>
            <div className="form-group">
              <label>Offboarding document</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) =>
                  updateWizardValue(
                    "documents",
                    "offboarding",
                    e.target.files?.[0] || null,
                  )
                }
              />
              {editWizardDraft.documents.offboarding && (
                <small>Selected: {editWizardDraft.documents.offboarding.name}</small>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return renderPersonalTab();
      case "employee":
        return renderEmployeeTab();
      case "payroll":
        return renderPayrollTab();
      case "documents":
        return (
          <>
            <h2 className="ed-tab-section-title">Documents</h2>
            <DetailCard title="Uploaded documents" canEdit={false}>
              {documentsLoading ? (
                <div className="ed-empty-tab">
                  Loading uploaded documents...
                </div>
              ) : documentsError ? (
                <div className="alert alert-error">{documentsError}</div>
              ) : employeeDocuments.length > 0 ? (
                <div className="ed-documents-list">
                  {employeeDocuments.map((document) => (
                    <a
                      key={document._id}
                      className="ed-document-item"
                      href={getDocumentUrl(document)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="ed-document-item__icon">
                        <i className="ti ti-file" aria-hidden="true" />
                      </span>
                      <span className="ed-document-item__body">
                        <strong>{document.fileName}</strong>
                        <small>
                          {document.category?.replaceAll("_", " ") ||
                            "Document"}{" "}
                          ·{" "}
                          {formatDate(
                            document.uploadedAt || document.createdAt,
                          )}
                        </small>
                      </span>
                      <span className="ed-document-item__action">Open</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="ed-empty-tab">
                  No uploaded documents found for this employee.
                </div>
              )}
            </DetailCard>
          </>
        );
      case "payroll-history":
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
          <p
            style={{
              fontSize: "var(--font-sm)",
              color: "var(--color-text-muted)",
              marginTop: "2px",
            }}
          >
            {user.emp_code
              ? `Employee code: ${user.emp_code}`
              : "Profile in progress"}
          </p>
          <div style={{ marginTop: "12px", maxWidth: "420px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "6px",
                fontSize: "12px",
                color: "var(--color-text-muted)",
              }}
            >
              <span>Profile completion</span>
              <strong
                style={{
                  color:
                    completionPercentage >= 100
                      ? "#1f8b4c"
                      : completionPercentage >= 60
                        ? "#c08a00"
                        : "#b42318",
                }}
              >
                {completionPercentage}%
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
                  width: `${Math.max(0, Math.min(100, completionPercentage))}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  background:
                    completionPercentage >= 100
                      ? "linear-gradient(90deg, #1f8b4c, rgba(15, 23, 42, 0.85))"
                      : completionPercentage >= 60
                        ? "linear-gradient(90deg, #c08a00, rgba(15, 23, 42, 0.75))"
                        : "linear-gradient(90deg, #b42318, rgba(15, 23, 42, 0.72))",
                }}
              />
            </div>
            {missingSections.length > 0 && (
              <div className="ed-completion-summary">
                <div className="ed-completion-summary__row">
                  <span className="ed-completion-summary__label">
                    Missing sections
                  </span>
                  <strong className="ed-completion-summary__value">
                    {missingSections.join(", ")}
                  </strong>
                </div>
                <div className="ed-completion-summary__chips">
                  {sectionProgress.map((section) => (
                    <span
                      key={section.key}
                      className={`ed-completion-chip${section.percentage === 100 ? " is-complete" : ""}`}
                    >
                      {section.label} {section.percentage}%
                    </span>
                  ))}
                </div>
                {missingDetails.length > 0 && (
                  <div className="ed-missing-fields">
                    {missingDetails.map((section) => (
                      <div
                        key={section.key}
                        className="ed-missing-fields__section"
                      >
                        <span className="ed-missing-fields__title">
                          {section.label} missing:
                        </span>
                        <span className="ed-missing-fields__items">
                          {section.missingFields
                            .map((field) => field.label || field)
                            .join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {completionPercentage < 100 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: "10px" }}
                onClick={jumpToMissingDetails}
              >
                Review missing details
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openEditWizard(0)}
          >
            Edit Details
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/employees")}
          >
            Back
          </button>
        </div>
      </div>

      <div className="ed-tabs-wrap">
        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab${activeTab === tab.id ? " active" : ""}`}
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

      {editWizardOpen && editWizardDraft && (
        <div className="ed-wizard-overlay" role="dialog" aria-modal="true">
          <div className="ed-wizard">
            <div className="ed-wizard-head">
              <div>
                <p className="ed-breadcrumb" style={{ marginBottom: 4 }}>
                  Employee <span>/</span> Edit Details
                </p>
                <h2 className="ed-wizard-title">
                  {EDIT_STEPS[editWizardStep].label}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEditWizard}
              >
                Close
              </button>
            </div>

            <div className="ed-wizard-stepper">
              {EDIT_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`ed-wizard-step${index === editWizardStep ? " is-active" : index < editWizardStep ? " is-complete" : ""}`}
                >
                  <span className="ed-wizard-step__dot">{index + 1}</span>
                  <span className="ed-wizard-step__label">{step.label}</span>
                </div>
              ))}
            </div>

            {editWizardError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {editWizardError}
              </div>
            )}

            <div className="ed-wizard-body">{renderEditWizardStep()}</div>

            <div className="ed-wizard-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEditWizard}
                disabled={editWizardSaving}
              >
                Cancel
              </button>
              {editWizardStep > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditWizardStep((prev) => prev - 1)}
                  disabled={editWizardSaving}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => saveEditWizardStep(editWizardStep < EDIT_STEPS.length - 1)}
                disabled={editWizardSaving}
              >
                {editWizardSaving
                  ? "Saving..."
                  : editWizardStep < EDIT_STEPS.length - 1
                    ? "Save & Next"
                    : "Save & Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;
