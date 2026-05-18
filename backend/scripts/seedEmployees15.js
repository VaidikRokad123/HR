import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";
import { appendPayrollHistoryIfChanged } from "../utils/employeeCompat.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const employees = [
  {
    emp_code: "SEED001",
    fullName: "Aarav Sharma",
    gender: "Male",
    dob: "1994-03-12",
    maritalStatus: "Single",
    personalMobile: "9876500001",
    personalEmail: "aarav.sharma@example.com",
    department: "Engineering",
    designation: "Software Development Engineer - SDE 2",
    dateJoining: "2022-04-11",
    employmentType: "Permanent",
    workLocation: "Office",
    gross: 75000,
    ctc: 1100000,
  },
  {
    emp_code: "SEED002",
    fullName: "Diya Patel",
    gender: "Female",
    dob: "1996-08-21",
    maritalStatus: "Single",
    personalMobile: "9876500002",
    personalEmail: "diya.patel@example.com",
    department: "Design",
    designation: "Sr. UI/UX",
    dateJoining: "2021-09-06",
    employmentType: "Permanent",
    workLocation: "Hybrid",
    gross: 68000,
    ctc: 980000,
  },
  {
    emp_code: "SEED003",
    fullName: "Vivaan Mehta",
    gender: "Male",
    dob: "1992-11-04",
    maritalStatus: "Married",
    personalMobile: "9876500003",
    personalEmail: "vivaan.mehta@example.com",
    department: "Product & Delivery",
    designation: "Product Manager",
    dateJoining: "2020-01-15",
    employmentType: "Permanent",
    workLocation: "Office",
    gross: 105000,
    ctc: 1650000,
  },
  {
    emp_code: "SEED004",
    fullName: "Ananya Iyer",
    gender: "Female",
    dob: "1997-02-17",
    maritalStatus: "Single",
    personalMobile: "9876500004",
    personalEmail: "ananya.iyer@example.com",
    department: "Human Resources",
    designation: "Jr Human Resource Executive",
    dateJoining: "2023-06-19",
    employmentType: "Probation",
    workLocation: "Office",
    gross: 42000,
    ctc: 560000,
  },
  {
    emp_code: "SEED005",
    fullName: "Kabir Khan",
    gender: "Male",
    dob: "1995-05-29",
    maritalStatus: "Single",
    personalMobile: "9876500005",
    personalEmail: "kabir.khan@example.com",
    department: "Sales & marketing",
    designation: "Sr. BDE",
    dateJoining: "2022-12-01",
    employmentType: "Permanent",
    workLocation: "Remote",
    gross: 62000,
    ctc: 880000,
  },
  {
    emp_code: "SEED006",
    fullName: "Riya Desai",
    gender: "Female",
    dob: "1998-07-09",
    maritalStatus: "Engaged",
    personalMobile: "9876500006",
    personalEmail: "riya.desai@example.com",
    department: "Engineering",
    designation: "Quality Assurance Engineer",
    dateJoining: "2023-03-27",
    employmentType: "Permanent",
    workLocation: "Hybrid",
    gross: 54000,
    ctc: 760000,
  },
  {
    emp_code: "SEED007",
    fullName: "Arjun Nair",
    gender: "Male",
    dob: "1991-10-30",
    maritalStatus: "Married",
    personalMobile: "9876500007",
    personalEmail: "arjun.nair@example.com",
    department: "Engineering",
    designation: "Team Lead - Software Development",
    dateJoining: "2019-08-12",
    employmentType: "Permanent",
    workLocation: "Office",
    gross: 125000,
    ctc: 2100000,
  },
  {
    emp_code: "SEED008",
    fullName: "Meera Joshi",
    gender: "Female",
    dob: "1999-12-14",
    maritalStatus: "Single",
    personalMobile: "9876500008",
    personalEmail: "meera.joshi@example.com",
    department: "Design",
    designation: "Intern - UI/UX UI/UX Designer",
    dateJoining: "2024-01-08",
    employmentType: "Internship",
    workLocation: "Office",
    gross: 22000,
    ctc: 264000,
  },
  {
    emp_code: "SEED009",
    fullName: "Ishaan Gupta",
    gender: "Male",
    dob: "1996-04-25",
    maritalStatus: "Single",
    personalMobile: "9876500009",
    personalEmail: "ishaan.gupta@example.com",
    department: "Engineering",
    designation: "Software Development Engineer - SDE 1",
    dateJoining: "2023-11-20",
    employmentType: "Probation",
    workLocation: "Remote",
    gross: 50000,
    ctc: 700000,
  },
  {
    emp_code: "SEED010",
    fullName: "Sara Sheikh",
    gender: "Female",
    dob: "1993-09-18",
    maritalStatus: "Divorced",
    personalMobile: "9876500010",
    personalEmail: "sara.sheikh@example.com",
    department: "Human Resources",
    designation: "Sr. Human Resource Executive",
    dateJoining: "2020-10-05",
    employmentType: "Permanent",
    workLocation: "Office",
    gross: 78000,
    ctc: 1150000,
  },
  {
    emp_code: "SEED011",
    fullName: "Dev Rao",
    gender: "Male",
    dob: "1997-06-03",
    maritalStatus: "Single",
    personalMobile: "9876500011",
    personalEmail: "dev.rao@example.com",
    department: "Product & Delivery",
    designation: "Team Lead",
    dateJoining: "2021-02-22",
    employmentType: "Permanent",
    workLocation: "Hybrid",
    gross: 92000,
    ctc: 1380000,
  },
  {
    emp_code: "SEED012",
    fullName: "Nisha Verma",
    gender: "Female",
    dob: "1998-01-31",
    maritalStatus: "Single",
    personalMobile: "9876500012",
    personalEmail: "nisha.verma@example.com",
    department: "Engineering",
    designation: "JR Quality Assurance Engineer",
    dateJoining: "2024-02-12",
    employmentType: "Trainee",
    workLocation: "Office",
    gross: 32000,
    ctc: 440000,
  },
  {
    emp_code: "SEED013",
    fullName: "Yash Trivedi",
    gender: "Male",
    dob: "1990-12-08",
    maritalStatus: "Married",
    personalMobile: "9876500013",
    personalEmail: "yash.trivedi@example.com",
    department: "Engineering",
    designation: "Software Development Engineer - SDE 3",
    dateJoining: "2018-07-16",
    employmentType: "Permanent",
    workLocation: "Office",
    gross: 150000,
    ctc: 2600000,
  },
  {
    emp_code: "SEED014",
    fullName: "Tara Kapoor",
    gender: "Female",
    dob: "1995-03-27",
    maritalStatus: "Single",
    personalMobile: "9876500014",
    personalEmail: "tara.kapoor@example.com",
    department: "Design",
    designation: "Intern-Graphics",
    dateJoining: "2024-03-04",
    employmentType: "Internship",
    workLocation: "Hybrid",
    gross: 20000,
    ctc: 240000,
  },
  {
    emp_code: "SEED015",
    fullName: "Om Prakash",
    gender: "Male",
    dob: "1994-05-11",
    maritalStatus: "Single",
    personalMobile: "9876500015",
    personalEmail: "om.prakash@example.com",
    department: "Sales & marketing",
    designation: "Sr. BDE",
    dateJoining: "2022-05-09",
    employmentType: "Permanent",
    workLocation: "Remote",
    gross: 64000,
    ctc: 920000,
  },
];

const stateByIndex = [
  "Gujarat",
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Rajasthan",
];
const cityByIndex = ["Ahmedabad", "Mumbai", "Bengaluru", "New Delhi", "Jaipur"];
const qualifications = [
  "B.Tech Computer Engineering",
  "MBA",
  "B.Des",
  "B.Com",
  "MCA",
];

const buildEmployeeDocument = (seed, index, userId) => {
  const num = String(index + 1).padStart(2, "0");
  const state = stateByIndex[index % stateByIndex.length];
  const city = cityByIndex[index % cityByIndex.length];
  const qualification = qualifications[index % qualifications.length];
  const officialEmail = seed.personalEmail.replace(
    "@example.com",
    "@saeculum.com",
  );
  const panSuffix = String(1000 + index).padStart(4, "0");
  const accountSuffix = String(100000 + index).padStart(6, "0");

  const employee = new EmployeeModel({
    userId,
    emp_code: seed.emp_code,
    fullName: seed.fullName,
    gender: seed.gender,
    dob: new Date(seed.dob),
    maritalStatus: seed.maritalStatus,
    religion: "not set yet",
    physicallyHandicapped: "No",
    bloodGroup: ["O+", "A+", "B+", "AB+"][index % 4],
    personalMobile: seed.personalMobile,
    personalEmail: seed.personalEmail,
    currentAddress: {
      street: `${100 + index}, Seed Residency`,
      city,
      state,
      pincode: `3800${num}`,
      country: "India",
    },
    sameAsCurrent: true,
    emergencyContacts: [
      {
        name: `Emergency Contact ${num}`,
        relationship: index % 2 === 0 ? "Father" : "Mother",
        phone: `98765100${num}`,
      },
    ],
    aadharNumber: `99998888${String(1000 + index)}`,
    panNumber: `SEEDA${panSuffix}Z`,
    passportNumber: "not set yet",
    drivingLicence: "not set yet",
    voterIdNumber: "not set yet",
    highestQualification: qualification,
    graduationYear: 2012 + (index % 10),
    instituteName: `${city} Institute of Technology`,
    previousEmployer: index % 3 === 0 ? "Previous Tech Pvt Ltd" : "not set yet",
    fatherName: `Father ${num}`,
    motherName: `Mother ${num}`,
    spouseName:
      seed.maritalStatus === "Married" ? `Spouse ${num}` : "not set yet",
    marriageDate:
      seed.maritalStatus === "Married" ? new Date("2020-02-14") : undefined,
    references: [
      {
        name: `Reference ${num}`,
        phone: `98765200${num}`,
        email: `reference${num}@example.com`,
      },
    ],
    dateJoining: new Date(seed.dateJoining),
    employmentType: seed.employmentType,
    probationMonths:
      seed.employmentType === "Probation" || seed.employmentType === "Trainee"
        ? 6
        : 0,
    confirmationDate:
      seed.employmentType === "Permanent"
        ? new Date(seed.dateJoining)
        : undefined,
    workLocation: seed.workLocation,
    designation: seed.designation,
    department: seed.department,
    reportingManager: ["Hardik Vinzava", "Vaidik", "Senior HR Administrator"][
      index % 3
    ],
    officialEmail,
    workMobile: `98765300${num}`,
    laptopAssigned: index % 2 === 0 ? "Yes" : "No",
    linkedinUrl: `https://www.linkedin.com/in/${seed.fullName.toLowerCase().replaceAll(" ", "-")}`,
    inProbation:
      seed.employmentType === "Probation" ||
      seed.employmentType === "Trainee" ||
      seed.employmentType === "Internship",
    probationEndedNotified: false,
    companyOpensBank: false,
    permissionToUsePanAadhar: true,
    accountHolderName: seed.fullName,
    bankNameBranch: [
      "HDFC Bank - Ahmedabad",
      "ICICI Bank - Mumbai",
      "Axis Bank - Bengaluru",
    ][index % 3],
    branch: city,
    accountNumber: `50100${accountSuffix}`,
    ifscCode: `SEED000${num}`,
    salaryAccountNumber: `60100${accountSuffix}`,
    salaryIfsc: `SALR000${num}`,
    gross: seed.gross,
    ctc: seed.ctc,
    pfApplicable: true,
    pfNumber: `PF-SEED-${num}`,
    uanNumber: `100200300${num}`,
    esicApplicable: seed.gross <= 50000,
    esicNumber: seed.gross <= 50000 ? `ESIC-SEED-${num}` : "not set yet",
    ptApplicable: true,
    ptNumber: `PT-SEED-${num}`,
    tdsApplicable: seed.ctc >= 1000000,
    tdsRegime: seed.ctc >= 1000000 ? "New Regime" : "not set yet",
    form12bb: "not set yet",
    pendingSections: [],
  });

  appendPayrollHistoryIfChanged(
    employee,
    {
      ctc: seed.ctc,
      gross: seed.gross,
      pfApplicable: true,
      ptApplicable: true,
      esicApplicable: seed.gross <= 50000,
      tdsApplicable: seed.ctc >= 1000000,
    },
    "seed setup",
  );

  return employee;
};

const seedEmployees = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME,
  });
  console.log("📦 Connected to MongoDB");

  const results = [];

  for (const [index, seed] of employees.entries()) {
    await Promise.all([
      UserModel.deleteMany({
        $or: [
          { emp_code: seed.emp_code },
          { email: seed.personalEmail },
          {
            email: seed.personalEmail.replace("@example.com", "@saeculum.com"),
          },
        ],
      }),
      EmployeeModel.deleteMany({
        $or: [
          { emp_code: seed.emp_code },
          { personalEmail: seed.personalEmail },
        ],
      }),
    ]);

    const user = await UserModel.create({
      email: seed.personalEmail.replace("@example.com", "@saeculum.com"),
      emp_code: seed.emp_code,
      status: "approved",
      pendingSections: [],
    });

    const employee = buildEmployeeDocument(seed, index, user._id);
    await employee.save();

    results.push({
      emp_code: seed.emp_code,
      name: seed.fullName,
      email: user.email,
    });
    console.log(`✅ Seeded ${seed.emp_code} - ${seed.fullName}`);
  }

  console.log(`\n🎉 Seeded ${results.length} employees successfully.`);
  console.table(results);
};

seedEmployees()
  .catch((error) => {
    console.error("❌ Failed to seed employees:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
