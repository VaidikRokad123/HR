import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../models/UserModel.js";
import EmployeePersonalModel from "../models/EmployeePersonalModel.js";
import EmployeeFamilyModel from "../models/EmployeeFamilyModel.js";
import EmployeeAddressModel from "../models/EmployeeAddressModel.js";
import EmployeeEmergencyModel from "../models/EmployeeEmergencyModel.js";
import EmployeeProfessionalModel from "../models/EmployeeProfessionalModel.js";
import EmployeeBankModel from "../models/EmployeeBankModel.js";
import { generateEmpCode } from "../utils/empCodeUtils.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// ─────────────────────────────────────────────────────
// ENUM MAPPINGS  (must match RBAC constants exactly)
// ─────────────────────────────────────────────────────
const departmentMap = {
  Engineering: "Engineering",
  "Human Resources": "Human Resources",
  Finance: "Product & Delivery",
  Marketing: "Sales & marketing",
  Design: "Design",
  Sales: "Sales & marketing",
  Operations: "Product & Delivery",
  "Customer Support": "Engineering",
};

const jobTitleMap = {
  "Senior Software Engineer": "Software Development Engineer - SDE 3",
  "HR Executive": "Jr Human Resource Executive",
  "Finance Manager": "Product Manager",
  "Marketing Executive": "Sr. BDE",
  "Tech Lead": "Team Lead",
  "UI/UX Designer": "Sr. UI/UX",
  "DevOps Engineer": "Software Development Engineer - SDE 2",
  "Sales Executive": "Sr. BDE",
  "Operations Manager": "Product Manager",
  "Customer Support Executive": "Quality Assurance Engineer",
};

function normalizeProfessional(p) {
  return {
    ...p,
    department: departmentMap[p.department] || p.department,
    jobTitle: jobTitleMap[p.jobTitle] || p.jobTitle,
    employmentType: p.inProbation ? "Probation" : "Permanent",
  };
}

// ─────────────────────────────────────────────────────
// EMPLOYEE DATA
// ─────────────────────────────────────────────────────
const employeesData = [
  // ── 1. Rajesh Kumar ──────────────────────────────────
  {
    user: { email: "rajesh.kumar@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Rajesh Kumar",
      gender: "Male",
      dob: new Date("1990-05-15"),
      mobile: "9876543210",
      personalEmail: "rajesh.k90@gmail.com",
      bloodGroup: "O+",
    },
    family: {
      fatherName: "Suresh Kumar",
      motherName: "Lakshmi Devi",
      maritalStatus: "Married",
      spouseName: "Priya Sharma",
      marriageDate: new Date("2015-12-10"),
    },
    address: {
      currentAddress: {
        street: "45, MG Road, Koramangala",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560034",
        country: "India",
      },
      permanentAddress: {
        street: "12, Gandhi Nagar",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Priya Sharma",
        relationship: "Spouse",
        mobile: "9876543211",
      },
      emergencyContact2: {
        name: "Suresh Kumar",
        relationship: "Father",
        mobile: "9876543212",
      },
    },
    professional: {
      nameAsPerAadhaar: "Rajesh Kumar",
      dateJoined: new Date("2020-01-15"),
      department: "Engineering",
      jobTitle: "Senior Software Engineer",
      reportingManager: "Vaidik",
      workEmail: "rajesh.kumar@saeculum.com",
      attendanceBiometricId: "BIO001",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/rajesh-kumar",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "ABCDE1234F",
      aadharNumber: "123456789012",
      bankName: "HDFC Bank",
      branch: "Koramangala",
      personalAccountNumber: "12345678901234",
      personalIfsc: "HDFC0001234",
      salaryAccountNumber: "12345678901234",
      salaryIfsc: "HDFC0001234",
    },
  },

  // ── 2. Priya Sharma ──────────────────────────────────
  {
    user: { email: "priya.sharma@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Priya Sharma",
      gender: "Female",
      dob: new Date("1992-08-22"),
      mobile: "9876543220",
      personalEmail: "priya.sharma92@gmail.com",
      bloodGroup: "A+",
    },
    family: {
      fatherName: "Ramesh Sharma",
      motherName: "Sunita Sharma",
      maritalStatus: "Single",
      spouseName: "",
      marriageDate: null,
    },
    address: {
      currentAddress: {
        street: "78, Brigade Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560025",
        country: "India",
      },
      permanentAddress: {
        street: "34, Nehru Place",
        city: "Delhi",
        state: "Delhi",
        pincode: "110019",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Ramesh Sharma",
        relationship: "Father",
        mobile: "9876543221",
      },
      emergencyContact2: {
        name: "Sunita Sharma",
        relationship: "Mother",
        mobile: "9876543222",
      },
    },
    professional: {
      nameAsPerAadhaar: "Priya Sharma",
      dateJoined: new Date("2021-03-10"),
      department: "Human Resources",
      jobTitle: "HR Executive",
      reportingManager: "Vaidik",
      workEmail: "priya.sharma@saeculum.com",
      attendanceBiometricId: "BIO002",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/priya-sharma",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "PQRST5678K",
      aadharNumber: "234567890123",
      bankName: "ICICI Bank",
      branch: "Brigade Road",
      personalAccountNumber: "23456789012345",
      personalIfsc: "ICIC0002345",
      salaryAccountNumber: "23456789012345",
      salaryIfsc: "ICIC0002345",
    },
  },

  // ── 3. Amit Patel ────────────────────────────────────
  {
    user: { email: "amit.patel@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Amit Patel",
      gender: "Male",
      dob: new Date("1988-03-18"),
      mobile: "9876543230",
      personalEmail: "amit.p88@gmail.com",
      bloodGroup: "B+",
    },
    family: {
      fatherName: "Dinesh Patel",
      motherName: "Rekha Patel",
      maritalStatus: "Married",
      spouseName: "Neha Patel",
      marriageDate: new Date("2012-11-25"),
    },
    address: {
      currentAddress: {
        street: "56, Whitefield Main Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560066",
        country: "India",
      },
      permanentAddress: {
        street: "89, Relief Road",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380001",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Neha Patel",
        relationship: "Spouse",
        mobile: "9876543231",
      },
      emergencyContact2: {
        name: "Dinesh Patel",
        relationship: "Father",
        mobile: "9876543232",
      },
    },
    professional: {
      nameAsPerAadhaar: "Amit Patel",
      dateJoined: new Date("2019-06-01"),
      department: "Finance",
      jobTitle: "Finance Manager",
      reportingManager: "Vaidik",
      workEmail: "amit.patel@saeculum.com",
      attendanceBiometricId: "BIO003",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/amit-patel",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "UVWXY9012M",
      aadharNumber: "345678901234",
      bankName: "SBI",
      branch: "Whitefield",
      personalAccountNumber: "34567890123456",
      personalIfsc: "SBIN0003456",
      salaryAccountNumber: "34567890123456",
      salaryIfsc: "SBIN0003456",
    },
  },

  // ── 4. Sneha Reddy ───────────────────────────────────
  {
    user: { email: "sneha.reddy@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Sneha Reddy",
      gender: "Female",
      dob: new Date("1995-11-30"),
      mobile: "9876543240",
      personalEmail: "sneha.reddy95@gmail.com",
      bloodGroup: "AB+",
    },
    family: {
      fatherName: "Krishna Reddy",
      motherName: "Padmavathi Reddy",
      maritalStatus: "Single",
      spouseName: "",
      marriageDate: null,
    },
    address: {
      currentAddress: {
        street: "23, Jubilee Hills",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
        country: "India",
      },
      permanentAddress: {
        street: "45, Banjara Hills",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500034",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Krishna Reddy",
        relationship: "Father",
        mobile: "9876543241",
      },
      emergencyContact2: {
        name: "Padmavathi Reddy",
        relationship: "Mother",
        mobile: "9876543242",
      },
    },
    professional: {
      nameAsPerAadhaar: "Sneha Reddy",
      dateJoined: new Date("2022-07-01"),
      department: "Marketing",
      jobTitle: "Marketing Executive",
      reportingManager: "Vaidik",
      workEmail: "sneha.reddy@saeculum.com",
      attendanceBiometricId: "BIO004",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/sneha-reddy",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "FGHIJ3456N",
      aadharNumber: "456789012345",
      bankName: "Axis Bank",
      branch: "Jubilee Hills",
      personalAccountNumber: "45678901234567",
      personalIfsc: "UTIB0004567",
      salaryAccountNumber: "45678901234567",
      salaryIfsc: "UTIB0004567",
    },
  },

  // ── 5. Vikram Singh ──────────────────────────────────
  {
    user: { email: "vikram.singh@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Vikram Singh",
      gender: "Male",
      dob: new Date("1987-07-04"),
      mobile: "9876543250",
      personalEmail: "vikram.s87@gmail.com",
      bloodGroup: "O-",
    },
    family: {
      fatherName: "Baldev Singh",
      motherName: "Gurpreet Kaur",
      maritalStatus: "Married",
      spouseName: "Simran Kaur",
      marriageDate: new Date("2013-02-14"),
    },
    address: {
      currentAddress: {
        street: "12, Sector 17",
        city: "Chandigarh",
        state: "Punjab",
        pincode: "160017",
        country: "India",
      },
      permanentAddress: {
        street: "34, Model Town",
        city: "Ludhiana",
        state: "Punjab",
        pincode: "141002",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Simran Kaur",
        relationship: "Spouse",
        mobile: "9876543251",
      },
      emergencyContact2: {
        name: "Baldev Singh",
        relationship: "Father",
        mobile: "9876543252",
      },
    },
    professional: {
      nameAsPerAadhaar: "Vikram Singh",
      dateJoined: new Date("2018-09-01"),
      department: "Engineering",
      jobTitle: "Tech Lead",
      reportingManager: "Vaidik",
      workEmail: "vikram.singh@saeculum.com",
      attendanceBiometricId: "BIO005",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/vikram-singh",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "KLMNO7890P",
      aadharNumber: "567890123456",
      bankName: "Punjab National Bank",
      branch: "Sector 17",
      personalAccountNumber: "56789012345678",
      personalIfsc: "PUNB0005678",
      salaryAccountNumber: "56789012345678",
      salaryIfsc: "PUNB0005678",
    },
  },

  // ── 6. Anjali Menon ──────────────────────────────────
  {
    user: { email: "anjali.menon@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Anjali Menon",
      gender: "Female",
      dob: new Date("1993-04-19"),
      mobile: "9876543260",
      personalEmail: "anjali.m93@gmail.com",
      bloodGroup: "B-",
    },
    family: {
      fatherName: "Suresh Menon",
      motherName: "Radha Menon",
      maritalStatus: "Single",
      spouseName: "",
      marriageDate: null,
    },
    address: {
      currentAddress: {
        street: "67, Indiranagar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560038",
        country: "India",
      },
      permanentAddress: {
        street: "89, MG Road",
        city: "Kochi",
        state: "Kerala",
        pincode: "682001",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Suresh Menon",
        relationship: "Father",
        mobile: "9876543261",
      },
      emergencyContact2: {
        name: "Radha Menon",
        relationship: "Mother",
        mobile: "9876543262",
      },
    },
    professional: {
      nameAsPerAadhaar: "Anjali Menon",
      dateJoined: new Date("2021-11-15"),
      department: "Design",
      jobTitle: "UI/UX Designer",
      reportingManager: "Vaidik",
      workEmail: "anjali.menon@saeculum.com",
      attendanceBiometricId: "BIO006",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/anjali-menon",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "QRSTU2345Q",
      aadharNumber: "678901234567",
      bankName: "Federal Bank",
      branch: "Indiranagar",
      personalAccountNumber: "67890123456789",
      personalIfsc: "FDRL0006789",
      salaryAccountNumber: "67890123456789",
      salaryIfsc: "FDRL0006789",
    },
  },

  // ── 7. Arjun Nair ────────────────────────────────────
  {
    user: { email: "arjun.nair@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Arjun Nair",
      gender: "Male",
      dob: new Date("1991-01-25"),
      mobile: "9876543270",
      personalEmail: "arjun.n91@gmail.com",
      bloodGroup: "A-",
    },
    family: {
      fatherName: "Gopal Nair",
      motherName: "Meena Nair",
      maritalStatus: "Married",
      spouseName: "Divya Nair",
      marriageDate: new Date("2017-05-20"),
    },
    address: {
      currentAddress: {
        street: "34, HSR Layout",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560102",
        country: "India",
      },
      permanentAddress: {
        street: "56, Palarivattom",
        city: "Kochi",
        state: "Kerala",
        pincode: "682025",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Divya Nair",
        relationship: "Spouse",
        mobile: "9876543271",
      },
      emergencyContact2: {
        name: "Gopal Nair",
        relationship: "Father",
        mobile: "9876543272",
      },
    },
    professional: {
      nameAsPerAadhaar: "Arjun Nair",
      dateJoined: new Date("2020-08-10"),
      department: "Engineering",
      jobTitle: "DevOps Engineer",
      reportingManager: "Vikram Singh",
      workEmail: "arjun.nair@saeculum.com",
      attendanceBiometricId: "BIO007",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/arjun-nair",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "VWXYZ6789R",
      aadharNumber: "789012345678",
      bankName: "South Indian Bank",
      branch: "HSR Layout",
      personalAccountNumber: "78901234567890",
      personalIfsc: "SIBL0007890",
      salaryAccountNumber: "78901234567890",
      salaryIfsc: "SIBL0007890",
    },
  },

  // ── 8. Kavya Iyer ────────────────────────────────────
  {
    user: { email: "kavya.iyer@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Kavya Iyer",
      gender: "Female",
      dob: new Date("1996-09-08"),
      mobile: "9876543280",
      personalEmail: "kavya.i96@gmail.com",
      bloodGroup: "O+",
    },
    family: {
      fatherName: "Venkat Iyer",
      motherName: "Gayathri Iyer",
      maritalStatus: "Single",
      spouseName: "",
      marriageDate: null,
    },
    address: {
      currentAddress: {
        street: "11, Adyar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600020",
        country: "India",
      },
      permanentAddress: {
        street: "22, T Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600017",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Venkat Iyer",
        relationship: "Father",
        mobile: "9876543281",
      },
      emergencyContact2: {
        name: "Gayathri Iyer",
        relationship: "Mother",
        mobile: "9876543282",
      },
    },
    professional: {
      nameAsPerAadhaar: "Kavya Iyer",
      dateJoined: new Date("2023-01-02"),
      department: "Sales",
      jobTitle: "Sales Executive",
      reportingManager: "Vaidik",
      workEmail: "kavya.iyer@saeculum.com",
      attendanceBiometricId: "BIO008",
      inProbation: true,
      probationDuration: 6,
      linkedinUrl: "https://linkedin.com/in/kavya-iyer",
    },
    bank: {
      companyOpensBank: true,
      panNumber: "ABCFG4567S",
      aadharNumber: "890123456789",
      bankName: "Canara Bank",
      branch: "Adyar",
      personalAccountNumber: "89012345678901",
      personalIfsc: "CNRB0008901",
      salaryAccountNumber: "89012345678901",
      salaryIfsc: "CNRB0008901",
    },
  },

  // ── 9. Rahul Verma ───────────────────────────────────
  {
    user: { email: "rahul.verma@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Rahul Verma",
      gender: "Male",
      dob: new Date("1989-12-05"),
      mobile: "9876543290",
      personalEmail: "rahul.v89@gmail.com",
      bloodGroup: "B+",
    },
    family: {
      fatherName: "Mahesh Verma",
      motherName: "Sushila Verma",
      maritalStatus: "Married",
      spouseName: "Pooja Verma",
      marriageDate: new Date("2016-04-18"),
    },
    address: {
      currentAddress: {
        street: "99, Gomti Nagar",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226010",
        country: "India",
      },
      permanentAddress: {
        street: "12, Civil Lines",
        city: "Allahabad",
        state: "Uttar Pradesh",
        pincode: "211001",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Pooja Verma",
        relationship: "Spouse",
        mobile: "9876543291",
      },
      emergencyContact2: {
        name: "Mahesh Verma",
        relationship: "Father",
        mobile: "9876543292",
      },
    },
    professional: {
      nameAsPerAadhaar: "Rahul Verma",
      dateJoined: new Date("2017-04-03"),
      department: "Operations",
      jobTitle: "Operations Manager",
      reportingManager: "Vaidik",
      workEmail: "rahul.verma@saeculum.com",
      attendanceBiometricId: "BIO009",
      inProbation: false,
      linkedinUrl: "https://linkedin.com/in/rahul-verma",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "HIJKL8901T",
      aadharNumber: "901234567890",
      bankName: "Bank of Baroda",
      branch: "Gomti Nagar",
      personalAccountNumber: "90123456789012",
      personalIfsc: "BARB0009012",
      salaryAccountNumber: "90123456789012",
      salaryIfsc: "BARB0009012",
    },
  },

  // ── 10. Meera Joshi ──────────────────────────────────
  {
    user: { email: "meera.joshi@saeculum.com", password: "Welcome@123" },
    personal: {
      fullName: "Meera Joshi",
      gender: "Female",
      dob: new Date("1994-06-14"),
      mobile: "9876543200",
      personalEmail: "meera.j94@gmail.com",
      bloodGroup: "AB-",
    },
    family: {
      fatherName: "Prakash Joshi",
      motherName: "Savita Joshi",
      maritalStatus: "Single",
      spouseName: "",
      marriageDate: null,
    },
    address: {
      currentAddress: {
        street: "5, Kalyani Nagar",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411006",
        country: "India",
      },
      permanentAddress: {
        street: "77, Deccan Gymkhana",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411004",
        country: "India",
      },
    },
    emergency: {
      emergencyContact1: {
        name: "Prakash Joshi",
        relationship: "Father",
        mobile: "9876543201",
      },
      emergencyContact2: {
        name: "Savita Joshi",
        relationship: "Mother",
        mobile: "9876543202",
      },
    },
    professional: {
      nameAsPerAadhaar: "Meera Joshi",
      dateJoined: new Date("2022-02-21"),
      department: "Customer Support",
      jobTitle: "Customer Support Executive",
      reportingManager: "Vaidik",
      workEmail: "meera.joshi@saeculum.com",
      attendanceBiometricId: "BIO010",
      inProbation: true,
      probationDuration: 3,
      linkedinUrl: "https://linkedin.com/in/meera-joshi",
    },
    bank: {
      companyOpensBank: false,
      panNumber: "MNOPQ2345U",
      aadharNumber: "012345678901",
      bankName: "Bank of Maharashtra",
      branch: "Kalyani Nagar",
      personalAccountNumber: "01234567890123",
      personalIfsc: "MAHB0010123",
      salaryAccountNumber: "01234567890123",
      salaryIfsc: "MAHB0010123",
    },
  },
];

// ─────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────
const seedEmployees = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    });
    console.log("✅ MongoDB Connected");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const salt = await bcrypt.genSalt(10);
    let created = 0;
    let patched = 0;

    for (const empData of employeesData) {
      try {
        let user = await UserModel.findOne({ email: empData.user.email });
        let emp_code;
        let isNew = false;

        // ── Create user if missing ──────────────────
        if (!user) {
          emp_code = await generateEmpCode();
          const passwordHash = await bcrypt.hash(empData.user.password, salt);
          user = await UserModel.create({
            email: empData.user.email,
            passwordHash,
            role: "employee",
            emp_code,
            status: "approved",
          });
          isNew = true;
        } else {
          emp_code = user.emp_code;
        }

        const uid = user._id;

        // ── Upsert every sub-document ───────────────
        await EmployeePersonalModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...empData.personal } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await EmployeeFamilyModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...empData.family } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await EmployeeAddressModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...empData.address } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await EmployeeEmergencyModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...empData.emergency } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        const normProf = normalizeProfessional(empData.professional);
        await EmployeeProfessionalModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...normProf } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await EmployeeBankModel.findOneAndUpdate(
          { emp_code },
          { $setOnInsert: { userId: uid, emp_code, ...empData.bank } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        if (isNew) {
          console.log(
            `✅ Created : ${empData.personal.fullName} (${emp_code})`,
          );
          created++;
        } else {
          console.log(
            `🔧 Patched : ${empData.personal.fullName} (${emp_code}) - filled missing sub-docs`,
          );
          patched++;
        }
      } catch (err) {
        console.error(
          `❌ Error for ${empData.personal?.fullName}:`,
          err.message,
        );
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 SEED SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Newly Created : ${created}`);
    console.log(`🔧 Patched       : ${patched}`);
    console.log(`📋 Total         : ${created + patched}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🔑 Default password for all employees: Welcome@123");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedEmployees();
