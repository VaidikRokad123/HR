import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { state_arr, s_a } from "../utils/locationData";
import "./EmployeeDetail.css";

const INDIAN_BANKS = [
  "State Bank of India", "Punjab National Bank", "Bank of Baroda", "Bank of India", "Canara Bank",
  "Union Bank of India", "Indian Bank", "Central Bank of India", "Indian Overseas Bank", "UCO Bank",
  "Bank of Maharashtra", "Punjab & Sind Bank", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Federal Bank", "South Indian Bank", "Bandhan Bank",
  "RBL Bank", "City Union Bank", "Karur Vysya Bank", "Karnataka Bank", "Jammu & Kashmir Bank",
  "CSB Bank", "DCB Bank", "Dhanlaxmi Bank", "Nainital Bank", "SBM Bank India", "Tamilnad Mercantile Bank",
  "IDBI Bank", "Other"
];

const departmentOptions = [
  "Engineering",
  "Product & Delivery",
  "Human Resources",
  "Sales & Marketing",
  "Design",
];

const designationByDepartment = {
  Engineering: [
    "Software Development Engineer - SDE 1",
    "Software Development Engineer - SDE 2",
    "Software Development Engineer - SDE 3",
    "Software Development - Intern",
    "Team Lead - Software Development",
    "JR Quality Assurance Engineer",
    "Quality Assurance Engineer",
    "SR Quality Assurance Engineer",
    "Quality Assurance - Intern",
  ],
  "Product & Delivery": [
    "Product Manager",
    "Team Lead",
  ],
  "Human Resources": [
    "Jr Human Resource Executive",
    "Sr. Human Resource Executive",
  ],
  "Sales & Marketing": [
    "Sr. BDE",
  ],
  Design: [
    "Sr. UI/UX",
    "Intern - UI/UX UI/UX Designer",
    "Intern-Graphics",
    "Jr. Video Editor",
  ],
};

const designationOptions = Object.values(designationByDepartment).flat();

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
  { id: "identity", label: "Basic Identity" },
  { id: "contact", label: "Contact" },
  { id: "government_id", label: "Government ID" },
  { id: "education", label: "Education" },
  { id: "employment", label: "Employment" },
  { id: "payroll", label: "Payroll" },
  { id: "documents", label: "Documents" },
];

const MISSING_SECTION_TARGETS = {
  Personal: { tab: "identity", edit: "identity" },
  Contact: { tab: "contact", edit: "contact" },
  "Government ID": { tab: "government_id", edit: "government_id" },
  Education: { tab: "education", edit: "education" },
  Employment: { tab: "employment", edit: "employment" },
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
        bankName: data.bankName || data.bankNameBranch,
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
        emergencyContacts: (
          data.emergencyContacts ||
          [data.emergencyContact1, data.emergencyContact2].filter(Boolean)
        ).map((contact) => ({
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
  const education = employee.education || {};

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
      highestQualification: education.highestQualification || personal.highestQualification || "",
      graduationYear: education.graduationYear || personal.graduationYear || "",
      instituteName: education.instituteName || personal.instituteName || "",
      previousEmployer: personal.previousEmployer || "",
      references:
        education.references?.length > 0
          ? education.references.map((reference) => ({
              name: reference?.name || "",
              phone: reference?.phone || "",
              email: reference?.email || "",
            }))
          : family.references?.length > 0
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
      exitDate: toDateInputValue(professional.exitDate),
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
      ctcPerYear: payroll.ctcPerYear || "",
      grossPerMonth: payroll.grossPerMonth || "",
      salaryPerMonth: payroll.salaryPerMonth || "",
      bankName: bank.bankName || bank.bankNameBranch || "",
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
      tdsApplicable: Boolean(payroll.tdsApplicable ?? payroll.tds),
      tdsRegime: payroll.tdsRegime || "",
      tdsDocProof: payroll.tdsDocProof || "",
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
          module: "education",
          data: {
            highestQualification: draft.education.highestQualification,
            graduationYear: draft.education.graduationYear,
            instituteName: draft.education.instituteName,
            previousEmployer: draft.education.previousEmployer,
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
            exitDate: draft.employment.exitDate,
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
            bankName: draft.payroll.bankName,
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
            ctcPerYear: draft.payroll.ctcPerYear,
            grossPerMonth: draft.payroll.grossPerMonth,
            salaryPerMonth: draft.payroll.salaryPerMonth,
            pfApplicable: draft.payroll.pfApplicable,
            pfNumber: draft.payroll.pfNumber,
            uanNumber: draft.payroll.uanNumber,
            esicApplicable: draft.payroll.esicApplicable,
            esicNumber: draft.payroll.esicNumber,
            ptApplicable: draft.payroll.ptApplicable,
            tdsApplicable: draft.payroll.tdsApplicable,
            tdsRegime: draft.payroll.tdsRegime,
            tdsDocProof: draft.payroll.tdsDocProof,
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
  const [activeTab, setActiveTab] = useState("identity");
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
      setEditWizardDraft(buildEditDraft(data));
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
      setEmployeeData((prev) => {
        const next = {
          ...prev,
          bank: unlocked.bank,
          payroll: unlocked.payroll,
          sensitiveDetailsLocked: false,
        };
        setEditWizardDraft(buildEditDraft(next));
        return next;
      });
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
    const tabId = missingTarget.tab || "identity";
    setActiveTab(tabId);
    setEditWizardStep(EDIT_STEP_INDEX[tabId] || 0);
    setEditMode(tabId);
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
                <select
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
                >
                  <option value="">Select city</option>
                  {(() => {
                    const idx = state_arr.indexOf(editWizardDraft.contact.currentAddress.state) + 1;
                    const cities = idx > 0 && s_a[idx] ? s_a[idx].split("|").map((c) => c.trim()).filter(Boolean) : [];
                    return cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div className="form-group">
                <label>State</label>
                <select
                  value={editWizardDraft.contact.currentAddress.state}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "state",
                      value,
                    );
                    updateWizardNestedObjectValue(
                      "contact",
                      "currentAddress",
                      "city",
                      "",
                    );
                    if (editWizardDraft.contact.sameAsCurrent) {
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "state",
                        value,
                      );
                      updateWizardNestedObjectValue(
                        "contact",
                        "permanentAddress",
                        "city",
                        "",
                      );
                    }
                  }}
                >
                  <option value="">Select state</option>
                  {state_arr.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
                    <select
                      value={editWizardDraft.contact.permanentAddress.city}
                      onChange={(e) =>
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "city",
                          e.target.value,
                        )
                      }
                    >
                      <option value="">Select city</option>
                      {(() => {
                        const idx = state_arr.indexOf(editWizardDraft.contact.permanentAddress.state) + 1;
                        const cities = idx > 0 && s_a[idx] ? s_a[idx].split("|").map((c) => c.trim()).filter(Boolean) : [];
                        return cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <select
                      value={editWizardDraft.contact.permanentAddress.state}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "state",
                          value,
                        );
                        updateWizardNestedObjectValue(
                          "contact",
                          "permanentAddress",
                          "city",
                          "",
                        );
                      }}
                    >
                      <option value="">Select state</option>
                      {state_arr.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
              <label>Exit Date</label>
              <input
                type="date"
                value={editWizardDraft.employment.exitDate}
                onChange={(e) =>
                  updateWizardValue("employment", "exitDate", e.target.value)
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
                {(() => {
                  const dept = editWizardDraft.employment.department;
                  const deptKey = dept ? Object.keys(designationByDepartment).find(k => k.toLowerCase() === dept.toLowerCase()) : null;
                  const opts = deptKey
                    ? designationByDepartment[deptKey]
                    : (referenceOptions.designations || designationOptions);
                  return opts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ));
                })()}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select
                value={editWizardDraft.employment.department}
                onChange={(e) => {
                  updateWizardValue("employment", "department", e.target.value);
                  updateWizardValue("employment", "designation", "");
                }}
              >
                <option value="">Select department</option>
                {(referenceOptions.departments || departmentOptions).map((department) => (
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
                <label>CTC Per Year</label>
                <input
                  type="number"
                  value={editWizardDraft.payroll.ctcPerYear}
                  onChange={(e) =>
                    updateWizardValue("payroll", "ctcPerYear", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Gross Per Month</label>
                <input
                  type="number"
                  value={editWizardDraft.payroll.grossPerMonth}
                  onChange={(e) =>
                    updateWizardValue("payroll", "grossPerMonth", e.target.value)
                  }
                />
              </div>
              <div className="form-group">
                <label>Salary Per Month</label>
                <input
                  type="number"
                  value={editWizardDraft.payroll.salaryPerMonth}
                  onChange={(e) =>
                    updateWizardValue("payroll", "salaryPerMonth", e.target.value)
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
                <label>Bank Name</label>
                <div>
                  <select
                    value={INDIAN_BANKS.includes(editWizardDraft.payroll.bankName) ? editWizardDraft.payroll.bankName : (editWizardDraft.payroll.bankName ? "Other" : "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") updateWizardValue("payroll", "bankName", " ");
                      else updateWizardValue("payroll", "bankName", val);
                    }}
                  >
                    <option value="">Select Bank</option>
                    {INDIAN_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                  {(!INDIAN_BANKS.includes(editWizardDraft.payroll.bankName) && editWizardDraft.payroll.bankName !== "") && (
                    <input
                      style={{ marginTop: 8 }}
                      type="text"
                      value={editWizardDraft.payroll.bankName.trim()}
                      onChange={(e) =>
                        updateWizardValue("payroll", "bankName", e.target.value || " ")
                      }
                      placeholder="Enter custom bank name"
                    />
                  )}
                </div>
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
                <label>TDS Applicable</label>
                <select
                  value={editWizardDraft.payroll.tdsApplicable ? "yes" : "no"}
                  onChange={(e) =>
                    updateWizardValue(
                      "payroll",
                      "tdsApplicable",
                      e.target.value === "yes",
                    )
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
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
                <label>TDS DOC PROOF</label>
                <input
                  type="text"
                  value={editWizardDraft.payroll.tdsDocProof}
                  onChange={(e) =>
                    updateWizardValue("payroll", "tdsDocProof", e.target.value)
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
    if (!editWizardDraft) return null;
    const currentStep = EDIT_STEPS.find(s => s.id === activeTab);
    const stepIndex = EDIT_STEP_INDEX[activeTab];

    if (
      (activeTab === "payroll" || activeTab === "government_id") &&
      !sensitiveDetails.unlocked
    ) {
      return (
        <div className="ed-tab-content" style={{ marginTop: 24 }}>
          {renderSensitiveGate(
            currentStep.label,
            `${currentStep.label} details are protected`
          )}
        </div>
      );
    }

    const isEditing = editMode === activeTab;
    
    return (
      <div className="ed-tab-content" style={{ marginTop: 24 }}>
        <DetailCard
          title={currentStep.label}
          canEdit={true}
          isEditing={isEditing}
          onEdit={() => {
            setEditMode(activeTab);
            setEditWizardStep(stepIndex);
          }}
          onSave={async () => {
            await saveEditWizardStep(false);
            setEditMode(null);
          }}
          onCancel={() => {
            setEditMode(null);
            setEditWizardDraft(buildEditDraft(employeeData));
          }}
        >
          <fieldset disabled={!isEditing} style={{ border: "none", padding: 0, margin: 0 }}>
            {renderEditWizardStep()}
          </fieldset>
          
          {activeTab === "documents" && (
            <div style={{ marginTop: 24 }}>
              <h4 className="ed-subsection-title">Uploaded documents</h4>
              {documentsLoading ? (
                <div className="ed-empty-tab">Loading uploaded documents...</div>
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
                          {document.category?.replaceAll("_", " ") || "Document"} · {formatDate(document.uploadedAt || document.createdAt)}
                        </small>
                      </span>
                      <span className="ed-document-item__action">Open</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="ed-empty-tab">No uploaded documents found for this employee.</div>
              )}
            </div>
          )}
        </DetailCard>
      </div>
    );
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
                setEditWizardStep(EDIT_STEP_INDEX[tab.id]);
                if (editMode) cancelEdit();
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}

    </div>
  );
};

export default EmployeeDetail;
