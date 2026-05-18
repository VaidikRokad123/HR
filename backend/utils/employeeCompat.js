export const NA = "not set yet";

export const isBlank = (val) =>
  val === undefined || val === null || val === "" || val === NA;
export const cleanNA = (val) => (isBlank(val) ? undefined : val);
export const hasValue = (val) => !isBlank(val);
export const hasAnyValue = (...values) => values.some(hasValue);

export const employeeQueryForUser = (user) =>
  user?.emp_code
    ? { $or: [{ userId: user._id }, { emp_code: user.emp_code }] }
    : { userId: user?._id };

export const normalizeEmployeePayload = (payload = {}, extras = {}) => {
  const update = { ...payload, ...extras };

  if (payload.mobile !== undefined && update.personalMobile === undefined)
    update.personalMobile = payload.mobile;
  if (payload.dateJoined !== undefined && update.dateJoining === undefined)
    update.dateJoining = payload.dateJoined;
  if (payload.jobTitle !== undefined && update.designation === undefined)
    update.designation = payload.jobTitle;
  if (payload.workEmail !== undefined && update.officialEmail === undefined)
    update.officialEmail = payload.workEmail;
  if (
    payload.probationDuration !== undefined &&
    update.probationMonths === undefined
  )
    update.probationMonths = payload.probationDuration;
  if (payload.bankName !== undefined && update.bankNameBranch === undefined)
    update.bankNameBranch = payload.bankName;
  if (
    payload.personalAccountNumber !== undefined &&
    update.accountNumber === undefined
  )
    update.accountNumber = payload.personalAccountNumber;
  if (payload.personalIfsc !== undefined && update.ifscCode === undefined)
    update.ifscCode = payload.personalIfsc;
  if (payload.pf !== undefined && update.pfApplicable === undefined)
    update.pfApplicable = payload.pf;
  if (payload.pt !== undefined && update.ptApplicable === undefined)
    update.ptApplicable = payload.pt;
  if (payload.esic !== undefined && update.esicApplicable === undefined)
    update.esicApplicable = payload.esic;
  if (payload.tds !== undefined && update.tdsApplicable === undefined)
    update.tdsApplicable = payload.tds;

  delete update.mobile;
  delete update.dateJoined;
  delete update.jobTitle;
  delete update.workEmail;
  delete update.probationDuration;
  delete update.bankName;
  delete update.personalAccountNumber;
  delete update.personalIfsc;
  delete update.pf;
  delete update.pt;
  delete update.esic;
  delete update.tds;
  delete update.history;

  return dropUndefined(update);
};

export const moduleDataToEmployeeUpdate = (module, data = {}) => {
  switch (module) {
    case "personal":
      return normalizeEmployeePayload({
        fullName: data.fullName,
        gender: data.gender,
        dob: data.dob,
        maritalStatus: data.maritalStatus,
        religion: data.religion,
        physicallyHandicapped: data.physicallyHandicapped,
        personalMobile: data.personalMobile ?? data.mobile,
        personalEmail: data.personalEmail,
        bloodGroup: data.bloodGroup,
        highestQualification: data.highestQualification,
        graduationYear: data.graduationYear,
        instituteName: data.instituteName,
      });

    case "family":
      return normalizeEmployeePayload({
        fatherName: data.fatherName,
        motherName: data.motherName,
        maritalStatus: data.maritalStatus,
        spouseName: data.spouseName,
        marriageDate: data.marriageDate,
        references: data.references,
      });

    case "address":
      return normalizeEmployeePayload({
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        sameAsCurrent: data.sameAsCurrent,
      });

    case "emergency": {
      const contacts = [];
      if (data.emergencyContacts) {
        contacts.push(...data.emergencyContacts);
      } else {
        if (data.emergencyContact1)
          contacts.push(contactFromLegacy(data.emergencyContact1));
        if (data.emergencyContact2)
          contacts.push(contactFromLegacy(data.emergencyContact2));
      }
      return { emergencyContacts: contacts.filter(Boolean) };
    }

    case "professional":
      return normalizeEmployeePayload(data);

    case "bank":
      return normalizeEmployeePayload(data);

    case "payroll":
      return normalizeEmployeePayload(data);

    default:
      return null;
  }
};

const contactFromLegacy = (contact) => {
  if (!contact) return null;
  return {
    name: contact.name,
    relationship: contact.relationship,
    phone: contact.phone ?? contact.mobile,
  };
};

export const appendPayrollHistoryIfChanged = (
  employee,
  data = {},
  changeType = "updated by admin",
) => {
  const next = {
    ctc: data.ctc !== undefined ? Number(data.ctc) : employee.ctc,
    gross: data.gross !== undefined ? Number(data.gross) : employee.gross,
    pf:
      data.pfApplicable !== undefined
        ? data.pfApplicable
        : data.pf !== undefined
          ? data.pf
          : employee.pfApplicable,
    pt:
      data.ptApplicable !== undefined
        ? data.ptApplicable
        : data.pt !== undefined
          ? data.pt
          : employee.ptApplicable,
    esic:
      data.esicApplicable !== undefined
        ? data.esicApplicable
        : data.esic !== undefined
          ? data.esic
          : employee.esicApplicable,
    tds:
      data.tdsApplicable !== undefined
        ? data.tdsApplicable
        : data.tds !== undefined
          ? data.tds
          : employee.tdsApplicable,
  };

  const hasPayrollValue = [next.ctc, next.gross].some(
    (value) => value !== undefined && value !== null && value !== "",
  );
  if (!hasPayrollValue) return false;

  const changed = [
    [employee.ctc, next.ctc],
    [employee.gross, next.gross],
    [employee.pfApplicable, next.pf],
    [employee.ptApplicable, next.pt],
    [employee.esicApplicable, next.esic],
    [employee.tdsApplicable, next.tds],
  ].some(([oldVal, newVal]) => String(oldVal ?? "") !== String(newVal ?? ""));

  if (!employee.payrollHistory?.length || changed) {
    employee.payrollHistory = employee.payrollHistory || [];
    employee.payrollHistory.push({
      ...next,
      changeType,
      updatedAt: new Date(),
    });
  }

  employee.ctc = next.ctc;
  employee.gross = next.gross;
  employee.pfApplicable = Boolean(next.pf);
  employee.ptApplicable = Boolean(next.pt);
  employee.esicApplicable = Boolean(next.esic);
  employee.tdsApplicable = Boolean(next.tds);
  return changed;
};

export const toCompatSections = (employee, user = {}) => {
  if (!employee) {
    return {
      personal: null,
      family: null,
      address: null,
      emergency: null,
      professional: null,
      bank: null,
      payroll: null,
    };
  }

  const plain = employee.toObject ? employee.toObject() : employee;
  const base = {
    _id: plain._id,
    userId: plain.userId || user._id,
    emp_code: plain.emp_code || user.emp_code,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
  const emergencyContacts = plain.emergencyContacts || [];

  return {
    personal: {
      ...base,
      fullName: plain.fullName,
      gender: plain.gender,
      dob: plain.dob,
      age: plain.age,
      mobile: plain.personalMobile,
      personalMobile: plain.personalMobile,
      personalEmail: plain.personalEmail || user.email,
      bloodGroup: plain.bloodGroup,
      maritalStatus: plain.maritalStatus,
      religion: plain.religion,
      physicallyHandicapped: plain.physicallyHandicapped,
      highestQualification: plain.highestQualification,
      graduationYear: plain.graduationYear,
      instituteName: plain.instituteName,
    },
    family: {
      ...base,
      fatherName: plain.fatherName,
      motherName: plain.motherName,
      maritalStatus: plain.maritalStatus,
      spouseName: plain.spouseName,
      marriageDate: plain.marriageDate,
      references: plain.references || [],
    },
    address: {
      ...base,
      currentAddress: plain.currentAddress,
      permanentAddress: plain.permanentAddress,
      sameAsCurrent: plain.sameAsCurrent,
    },
    emergency: {
      ...base,
      emergencyContact1: legacyContact(emergencyContacts[0]),
      emergencyContact2: legacyContact(emergencyContacts[1]),
      emergencyContacts,
    },
    professional: {
      ...base,
      nameAsPerAadhaar: plain.fullName,
      dateJoined: plain.dateJoining,
      dateJoining: plain.dateJoining,
      exitDate: plain.exitDate,
      department: plain.department,
      jobTitle: plain.designation,
      designation: plain.designation,
      employmentType: plain.employmentType,
      reportingManager: plain.reportingManager,
      inProbation: plain.inProbation,
      probationDuration: plain.probationMonths,
      probationMonths: plain.probationMonths,
      probationEndedNotified: plain.probationEndedNotified,
      confirmationDate: plain.confirmationDate,
      workLocation: plain.workLocation,
      workEmail: plain.officialEmail || user.email,
      officialEmail: plain.officialEmail || user.email,
      workMobile: plain.workMobile,
      laptopAssigned: plain.laptopAssigned,
      linkedinUrl: plain.linkedinUrl,
    },
    bank: hasBankDetails(plain)
      ? {
          ...base,
          companyOpensBank: plain.companyOpensBank,
          panNumber: plain.panNumber,
          aadharNumber: plain.aadharNumber,
          permissionToUsePanAadhar: plain.permissionToUsePanAadhar,
          bankName: plain.bankNameBranch,
          bankNameBranch: plain.bankNameBranch,
          accountHolderName: plain.accountHolderName,
          branch: plain.branch,
          personalAccountNumber: plain.accountNumber,
          accountNumber: plain.accountNumber,
          personalIfsc: plain.ifscCode,
          ifscCode: plain.ifscCode,
          salaryAccountNumber: plain.salaryAccountNumber,
          salaryIfsc: plain.salaryIfsc,
        }
      : null,
    payroll: hasPayrollDetails(plain)
      ? {
          ...base,
          ctc: plain.ctc,
          gross: plain.gross,
          pf: plain.pfApplicable,
          pfApplicable: plain.pfApplicable,
          pt: plain.ptApplicable,
          ptApplicable: plain.ptApplicable,
          esic: plain.esicApplicable,
          esicApplicable: plain.esicApplicable,
          tds: plain.tdsApplicable,
          tdsApplicable: plain.tdsApplicable,
          pfNumber: plain.pfNumber,
          uanNumber: plain.uanNumber,
          esicNumber: plain.esicNumber,
          ptNumber: plain.ptNumber,
          tdsRegime: plain.tdsRegime,
          form12bb: plain.form12bb,
          history: plain.payrollHistory || [],
          payrollHistory: plain.payrollHistory || [],
        }
      : null,
  };
};

export const hasBankDetails = (employee = {}) =>
  hasAnyValue(
    employee.panNumber,
    employee.aadharNumber,
    employee.bankNameBranch,
    employee.accountHolderName,
    employee.accountNumber,
    employee.ifscCode,
  );

export const hasPayrollDetails = (employee = {}) =>
  hasAnyValue(employee.gross, employee.ctc);

const legacyContact = (contact) =>
  contact
    ? {
        name: contact.name,
        relationship: contact.relationship,
        mobile: contact.mobile ?? contact.phone,
        phone: contact.phone ?? contact.mobile,
      }
    : undefined;

export const dropUndefined = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  );
