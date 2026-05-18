
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeBankModel from '../models/EmployeeBankModel.js';
import EmployeePayrollModel from '../models/EmployeePayrollModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';

const FIRST_NAMES = [
  'Arjun', 'Pooja', 'Karan', 'Sneha', 'Rahul',
  'Nisha', 'Vivek', 'Anjali', 'Rohan', 'Priya',
  'Amit', 'Neha', 'Dev', 'Kavya', 'Yash'
];

const LAST_NAMES = [
  'Mehta', 'Sharma', 'Joshi', 'Kulkarni', 'Verma',
  'Patel', 'Desai', 'Trivedi', 'Pandya', 'Shah',
  'Rao', 'Iyer', 'Kapoor', 'Bhatt', 'Modi'
];

const GENDERS = ['Male', 'Female'];
const MARITAL_STATUSES = ['Single', 'Married'];
const RELIGIONS = ['Hindu', 'Jain', 'Muslim', 'Christian'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const QUALIFICATIONS = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'MBA', 'B.Sc IT'];
const EMPLOYMENT_TYPES = ['Permanent', 'Probation', 'Internship', 'Trainee', 'Contract Base'];
const WORK_LOCATIONS = ['Office', 'Remote', 'Hybrid'];

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Product & Delivery',
  'Design',
  'Sales & marketing'
];

const DESIGNATIONS = [
  'Software Development Engineer - SDE 1',
  'Software Development Engineer - SDE 2',
  'Team Lead - Software Development',
  'Product Manager',
  'Sr. Human Resource Executive',
  'Sr. UI/UX',
  'Software Development - Intern',
  'Quality Assurance - Intern'
];

const CITIES = [
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380015' },
  { city: 'Surat', state: 'Gujarat', pincode: '395009' },
  { city: 'Vadodara', state: 'Gujarat', pincode: '390001' },
  { city: 'Rajkot', state: 'Gujarat', pincode: '360001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411004' }
];

const BANKS = [
  { name: 'HDFC Bank', ifscPrefix: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC' },
  { name: 'State Bank of India', ifscPrefix: 'SBIN' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK' }
];

function rand(arr, i) {
  return arr[(i - 1) % arr.length];
}

function pad(num, len) {
  return String(num).padStart(len, '0');
}

function addYears(dateString, years) {
  const d = new Date(dateString);

  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date passed to addYears(): ${dateString}`);
  }

  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function generateEmployee(index) {
  const firstName = FIRST_NAMES[index - 1];
  const lastName = LAST_NAMES[index - 1];
  const fullName = `${firstName} ${lastName}`;

  const gender = rand(GENDERS, index);
  const maritalStatus = rand(MARITAL_STATUSES, index);
  const religion = rand(RELIGIONS, index);
  const bloodGroup = rand(BLOOD_GROUPS, index);
  const qualification = rand(QUALIFICATIONS, index);
  const employmentType = rand(EMPLOYMENT_TYPES, index);
  const workLocation = rand(WORK_LOCATIONS, index);
  const department = rand(DEPARTMENTS, index);
  const designation = rand(DESIGNATIONS, index);
  const cityData = rand(CITIES, index);
  const bank = rand(BANKS, index);

  const empCode = `EMP${pad(index, 4)}`;

  const personalMobile = `98${pad(index * 123456, 8).slice(0, 8)}`;
  const workMobile = `99${pad(index * 654321, 8).slice(0, 8)}`;

  const year = 2020 + (index % 5);
  const month = String((index % 12) + 1).padStart(2, '0');
  const joinDate = `${year}-${month}-15`;

  const probationMonths = employmentType === 'Internship' ? 0 : 3;

  const confirmationDate =
    probationMonths > 0
      ? addYears(joinDate, 0).replace(/-15$/, '-30')
      : '';

  const gross = 25000 + index * 5000;
  const ctc = gross * 12;

  const pfApplicable = gross >= 15000;
  const esicApplicable = gross <= 35000;
  const ptApplicable = true;

  return {
    emp_code: empCode,
    fullName,
    dob: `199${index % 10}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
    gender,
    maritalStatus,
    religion,
    physicallyHandicapped: 'No',
    bloodGroup,

    personalMobile,
    personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`, 

    currentAddress: {
      street: `${100 + index}, Sunrise Residency, Main Road`, 
      city: cityData.city,
      state: cityData.state,
      pincode: cityData.pincode
    },

    sameAsCurrent: index % 2 === 0,

    permanentAddress: {
      street: `${200 + index}, Family Home`, 
      city: cityData.city,
      state: cityData.state,
      pincode: cityData.pincode
    },

    emergencyContacts: [
      {
        name: `Rajesh ${lastName}`,
        phone: `97${pad(index * 111111, 8).slice(0, 8)}`,
        relationship: 'Father'
      },
      {
        name: `Kavita ${lastName}`,
        phone: `96${pad(index * 222222, 8).slice(0, 8)}`,
        relationship: 'Mother'
      }
    ],

    aadharNumber: `${1000 + index} ${2000 + index} ${3000 + index}`,
    panNumber: `${firstName.slice(0, 3).toUpperCase()}${lastName.slice(0, 2).toUpperCase()}${pad(index, 4)}A`, 
    passportNumber: `P${pad(index, 7)}`,
    drivingLicence: `GJ01${pad(index, 10)}`,
    voterIdNumber: `ABC${pad(index, 7)}`,

    highestQualification: qualification,
    graduationYear: String(2015 + (index % 10)),
    instituteName: 'Nirma University',
    previousEmployer: index <= 3 ? 'not set yet' : `Tech Company ${index - 1}`,

    references: [
      {
        name: `Reference ${index}`,
        phone: `95${pad(index * 333333, 8).slice(0, 8)}`,
        email: `reference${index}@example.com`
      },
      {
        name: `Senior Reference ${index}`,
        phone: `94${pad(index * 444444, 8).slice(0, 8)}`,
        email: `senior.reference${index}@example.com`
      }
    ],

    dateJoining: joinDate,
    employmentType,
    probationMonths,
    confirmationDate,
    workLocation,
    designation,
    department,
    reportingManager: 'Hardik Vinzava',
    officialEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@saeculumsolutions.com`, 
    workMobile,
    laptopAssigned: `Dell Latitude ${5400 + index}`,

    gross,
    ctc,

    accountHolderName: fullName,
    bankNameBranch: `${bank.name}, ${cityData.city} Branch`, 
    accountNumber: `50${pad(index, 12)}`,
    ifscCode: `${bank.ifscPrefix}000${pad(index, 4).slice(-4)}`,

    pfApplicable,
    pfNumber: pfApplicable ? `PF${pad(index, 8)}` : 'not set yet',
    uanNumber: pfApplicable ? `10000000${pad(index, 4)}` : 'not set yet',
    esicApplicable,
    esicNumber: esicApplicable ? `ESIC${pad(index, 8)}` : 'not set yet',
    ptApplicable,
    ptNumber: `PT${pad(index, 6)}`,
    tdsRegime: index % 2 === 0 ? 'New Tax Regime' : 'Old Tax Regime',
    form12bb: 'Submitted',
    pendingSections: []
  };
}

const EMPLOYEES = Array.from({ length: 15 }, (_, i) => generateEmployee(i + 1));

async function clearEmployee(empCode, officialEmail) {
  const user = await UserModel.findOne({
    $or: [
      { emp_code: empCode },
      { email: officialEmail.toLowerCase() }
    ]
  });

  if (!user) return;

  const userId = user._id;

  await Promise.all([
    EmployeePersonalModel.deleteMany({ userId }),
    EmployeeProfessionalModel.deleteMany({ userId }),
    EmployeeAddressModel.deleteMany({ userId }),
    EmployeeEmergencyModel.deleteMany({ userId }),
    EmployeeBankModel.deleteMany({ userId }),
    EmployeePayrollModel.deleteMany({ userId }),
    EmployeeFamilyModel.deleteMany({ userId }),
    UserModel.deleteOne({ _id: userId })
  ]);
}

async function seedEmployee(d) {
  console.log(`Seeding ${d.fullName} (${d.emp_code})`);

  await clearEmployee(d.emp_code, d.officialEmail);

  const user = await UserModel.create({
    email: d.officialEmail.toLowerCase(),
    emp_code: d.emp_code,
    status: 'approved'
  });

  const userId = user._id;

  await EmployeePersonalModel.create({
    userId,
    emp_code: d.emp_code,
    fullName: d.fullName,
    gender: d.gender,
    dob: new Date(d.dob),
    mobile: d.personalMobile,
    personalEmail: d.personalEmail,
    bloodGroup: d.bloodGroup,
    maritalStatus: d.maritalStatus,
    religion: d.religion,
    physicallyHandicapped: d.physicallyHandicapped
  });

  await EmployeeAddressModel.create({
    userId,
    emp_code: d.emp_code,
    currentAddress: d.currentAddress,
    permanentAddress: d.sameAsCurrent ? d.currentAddress : d.permanentAddress
  });

  await EmployeeEmergencyModel.create({
    userId,
    emp_code: d.emp_code,
    emergencyContact1: {
      name: d.emergencyContacts[0].name,
      relationship: d.emergencyContacts[0].relationship,
      mobile: d.emergencyContacts[0].phone
    },
    emergencyContact2: {
      name: d.emergencyContacts[1].name,
      relationship: d.emergencyContacts[1].relationship,
      mobile: d.emergencyContacts[1].phone
    }
  });

  await EmployeeProfessionalModel.create({
    userId,
    emp_code: d.emp_code,
    dateJoined: new Date(d.dateJoining),
    department: d.department,
    jobTitle: d.designation,
    employmentType: d.employmentType,
    reportingManager: d.reportingManager,
    workEmail: d.officialEmail,
    workMobile: d.workMobile,
    workLocation: d.workLocation,
    probationDuration: d.probationMonths,
    inProbation: d.probationMonths > 0,
    laptopAssigned: d.laptopAssigned,
    confirmationDate: d.confirmationDate ? new Date(d.confirmationDate) : undefined,
    probationEndedNotified: false
  });

  await EmployeeBankModel.create({
    userId,
    emp_code: d.emp_code,
    panNumber: d.panNumber,
    aadharNumber: d.aadharNumber,
    passportNumber: d.passportNumber,
    drivingLicence: d.drivingLicence,
    voterIdNumber: d.voterIdNumber,
    bankName: d.bankNameBranch,
    personalAccountNumber: d.accountNumber,
    personalIfsc: d.ifscCode,
    accountHolderName: d.accountHolderName
  });

  await EmployeePayrollModel.create({
    userId,
    emp_code: d.emp_code,
    gross: d.gross,
    ctc: d.ctc,
    pf: d.pfApplicable,
    pt: d.ptApplicable,
    esic: d.esicApplicable,
    pfNumber: d.pfNumber,
    uanNumber: d.uanNumber,
    esicNumber: d.esicNumber,
    ptNumber: d.ptNumber,
    tdsRegime: d.tdsRegime,
    form12bb: d.form12bb
  });

  console.log(`✔ Seeded ${d.emp_code}`);
}

async function main() {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME
    });

    console.log('Connected.');

    for (const employee of EMPLOYEES) {
      await seedEmployee(employee);
    }

    console.log(`\\n🎉 Successfully seeded ${EMPLOYEES.length} employees.`);

    await mongoose.disconnect(); 
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
