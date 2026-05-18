import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeeBankModel from '../models/EmployeeBankModel.js';
import { generateEmpCode } from '../utils/empCodeUtils.js';

dotenv.config();

const employeesData = [
  {
    user: {
      email: 'rajesh.kumar@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Rajesh Kumar',
      gender: 'Male',
      dob: new Date('1990-05-15'),
      mobile: '9876543210',
      personalEmail: 'rajesh.k90@gmail.com',
      bloodGroup: 'O+'
    },
    family: {
      fatherName: 'Suresh Kumar',
      motherName: 'Lakshmi Devi',
      maritalStatus: 'Married',
      spouseName: 'Priya Sharma',
      marriageDate: new Date('2015-12-10')
    },
    address: {
      currentAddress: {
        street: '45, MG Road, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560034',
        country: 'India'
      },
      permanentAddress: {
        street: '12, Gandhi Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Priya Sharma',
        relationship: 'Spouse',
        mobile: '9876543211'
      },
      emergencyContact2: {
        name: 'Suresh Kumar',
        relationship: 'Father',
        mobile: '9876543212'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Rajesh Kumar',
      dateJoined: new Date('2020-01-15'),
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'rajesh.kumar@saeculum.com',
      attendanceBiometricId: 'BIO001',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/rajesh-kumar'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'ABCDE1234F',
      aadharNumber: '123456789012',
      bankName: 'HDFC Bank',
      branch: 'Koramangala',
      personalAccountNumber: '12345678901234',
      personalIfsc: 'HDFC0001234',
      salaryAccountNumber: '12345678901234',
      salaryIfsc: 'HDFC0001234'
    }
  },
  {
    user: {
      email: 'priya.sharma@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Priya Sharma',
      gender: 'Female',
      dob: new Date('1992-08-22'),
      mobile: '9876543220',
      personalEmail: 'priya.sharma92@gmail.com',
      bloodGroup: 'A+'
    },
    family: {
      fatherName: 'Ramesh Sharma',
      motherName: 'Sunita Sharma',
      maritalStatus: 'Single',
      spouseName: '',
      marriageDate: null
    },
    address: {
      currentAddress: {
        street: '78, Brigade Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560025',
        country: 'India'
      },
      permanentAddress: {
        street: '34, Nehru Place',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110019',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Ramesh Sharma',
        relationship: 'Father',
        mobile: '9876543221'
      },
      emergencyContact2: {
        name: 'Sunita Sharma',
        relationship: 'Mother',
        mobile: '9876543222'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Priya Sharma',
      dateJoined: new Date('2021-03-10'),
      department: 'Human Resources',
      jobTitle: 'HR Executive',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'priya.sharma@saeculum.com',
      attendanceBiometricId: 'BIO002',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/priya-sharma'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'PQRST5678K',
      aadharNumber: '234567890123',
      bankName: 'ICICI Bank',
      branch: 'Brigade Road',
      personalAccountNumber: '23456789012345',
      personalIfsc: 'ICIC0002345',
      salaryAccountNumber: '23456789012345',
      salaryIfsc: 'ICIC0002345'
    }
  },
  {
    user: {
      email: 'amit.patel@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Amit Patel',
      gender: 'Male',
      dob: new Date('1988-03-18'),
      mobile: '9876543230',
      personalEmail: 'amit.p88@gmail.com',
      bloodGroup: 'B+'
    },
    family: {
      fatherName: 'Dinesh Patel',
      motherName: 'Rekha Patel',
      maritalStatus: 'Married',
      spouseName: 'Neha Patel',
      marriageDate: new Date('2012-11-25')
    },
    address: {
      currentAddress: {
        street: '56, Whitefield Main Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        country: 'India'
      },
      permanentAddress: {
        street: '89, Relief Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Neha Patel',
        relationship: 'Spouse',
        mobile: '9876543231'
      },
      emergencyContact2: {
        name: 'Dinesh Patel',
        relationship: 'Father',
        mobile: '9876543232'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Amit Patel',
      dateJoined: new Date('2019-06-01'),
      department: 'Finance',
      jobTitle: 'Finance Manager',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'amit.patel@saeculum.com',
      attendanceBiometricId: 'BIO003',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/amit-patel'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'UVWXY9012M',
      aadharNumber: '345678901234',
      bankName: 'SBI',
      branch: 'Whitefield',
      personalAccountNumber: '34567890123456',
      personalIfsc: 'SBIN0003456',
      salaryAccountNumber: '34567890123456',
      salaryIfsc: 'SBIN0003456'
    }
  },
  {
    user: {
      email: 'sneha.reddy@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Sneha Reddy',
      gender: 'Female',
      dob: new Date('1995-11-30'),
      mobile: '9876543240',
      personalEmail: 'sneha.r95@gmail.com',
      bloodGroup: 'AB+'
    },
    family: {
      fatherName: 'Krishna Reddy',
      motherName: 'Savitri Reddy',
      maritalStatus: 'Single',
      spouseName: '',
      marriageDate: null
    },
    address: {
      currentAddress: {
        street: '23, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        country: 'India'
      },
      permanentAddress: {
        street: '67, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Krishna Reddy',
        relationship: 'Father',
        mobile: '9876543241'
      },
      emergencyContact2: {
        name: 'Savitri Reddy',
        relationship: 'Mother',
        mobile: '9876543242'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Sneha Reddy',
      dateJoined: new Date('2022-02-14'),
      department: 'Marketing',
      jobTitle: 'Marketing Executive',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'sneha.reddy@saeculum.com',
      attendanceBiometricId: 'BIO004',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/sneha-reddy'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'LMNOP3456Q',
      aadharNumber: '456789012345',
      bankName: 'Axis Bank',
      branch: 'Indiranagar',
      personalAccountNumber: '45678901234567',
      personalIfsc: 'UTIB0004567',
      salaryAccountNumber: '45678901234567',
      salaryIfsc: 'UTIB0004567'
    }
  },
  {
    user: {
      email: 'vikram.singh@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Vikram Singh',
      gender: 'Male',
      dob: new Date('1987-07-08'),
      mobile: '9876543250',
      personalEmail: 'vikram.s87@gmail.com',
      bloodGroup: 'O-'
    },
    family: {
      fatherName: 'Rajveer Singh',
      motherName: 'Kamala Singh',
      maritalStatus: 'Married',
      spouseName: 'Anita Singh',
      marriageDate: new Date('2010-02-14')
    },
    address: {
      currentAddress: {
        street: '90, HSR Layout',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560102',
        country: 'India'
      },
      permanentAddress: {
        street: '45, Civil Lines',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Anita Singh',
        relationship: 'Spouse',
        mobile: '9876543251'
      },
      emergencyContact2: {
        name: 'Rajveer Singh',
        relationship: 'Father',
        mobile: '9876543252'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Vikram Singh',
      dateJoined: new Date('2018-09-20'),
      department: 'Engineering',
      jobTitle: 'Tech Lead',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'vikram.singh@saeculum.com',
      attendanceBiometricId: 'BIO005',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/vikram-singh'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'FGHIJ6789R',
      aadharNumber: '567890123456',
      bankName: 'Kotak Mahindra Bank',
      branch: 'HSR Layout',
      personalAccountNumber: '56789012345678',
      personalIfsc: 'KKBK0005678',
      salaryAccountNumber: '56789012345678',
      salaryIfsc: 'KKBK0005678'
    }
  },
  {
    user: {
      email: 'anjali.menon@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Anjali Menon',
      gender: 'Female',
      dob: new Date('1993-04-12'),
      mobile: '9876543260',
      personalEmail: 'anjali.m93@gmail.com',
      bloodGroup: 'A-'
    },
    family: {
      fatherName: 'Raghavan Menon',
      motherName: 'Sujatha Menon',
      maritalStatus: 'Single',
      spouseName: '',
      marriageDate: null
    },
    address: {
      currentAddress: {
        street: '12, Jayanagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560041',
        country: 'India'
      },
      permanentAddress: {
        street: '34, Marine Drive',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682031',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Raghavan Menon',
        relationship: 'Father',
        mobile: '9876543261'
      },
      emergencyContact2: {
        name: 'Sujatha Menon',
        relationship: 'Mother',
        mobile: '9876543262'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Anjali Menon',
      dateJoined: new Date('2021-07-01'),
      department: 'Design',
      jobTitle: 'UI/UX Designer',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'anjali.menon@saeculum.com',
      attendanceBiometricId: 'BIO006',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/anjali-menon'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'STUVW2345X',
      aadharNumber: '678901234567',
      bankName: 'Federal Bank',
      branch: 'Jayanagar',
      personalAccountNumber: '67890123456789',
      personalIfsc: 'FDRL0006789',
      salaryAccountNumber: '67890123456789',
      salaryIfsc: 'FDRL0006789'
    }
  },
  {
    user: {
      email: 'arjun.nair@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Arjun Nair',
      gender: 'Male',
      dob: new Date('1991-09-25'),
      mobile: '9876543270',
      personalEmail: 'arjun.n91@gmail.com',
      bloodGroup: 'B-'
    },
    family: {
      fatherName: 'Suresh Nair',
      motherName: 'Latha Nair',
      maritalStatus: 'Married',
      spouseName: 'Divya Nair',
      marriageDate: new Date('2016-05-20')
    },
    address: {
      currentAddress: {
        street: '67, Electronic City',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        country: 'India'
      },
      permanentAddress: {
        street: '23, Fort Road',
        city: 'Trivandrum',
        state: 'Kerala',
        pincode: '695023',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Divya Nair',
        relationship: 'Spouse',
        mobile: '9876543271'
      },
      emergencyContact2: {
        name: 'Suresh Nair',
        relationship: 'Father',
        mobile: '9876543272'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Arjun Nair',
      dateJoined: new Date('2020-11-10'),
      department: 'Engineering',
      jobTitle: 'DevOps Engineer',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'arjun.nair@saeculum.com',
      attendanceBiometricId: 'BIO007',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/arjun-nair'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'NOPQR7890Y',
      aadharNumber: '789012345678',
      bankName: 'Canara Bank',
      branch: 'Electronic City',
      personalAccountNumber: '78901234567890',
      personalIfsc: 'CNRB0007890',
      salaryAccountNumber: '78901234567890',
      salaryIfsc: 'CNRB0007890'
    }
  },
  {
    user: {
      email: 'kavya.iyer@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Kavya Iyer',
      gender: 'Female',
      dob: new Date('1994-12-05'),
      mobile: '9876543280',
      personalEmail: 'kavya.i94@gmail.com',
      bloodGroup: 'AB-'
    },
    family: {
      fatherName: 'Venkatesh Iyer',
      motherName: 'Meena Iyer',
      maritalStatus: 'Single',
      spouseName: '',
      marriageDate: null
    },
    address: {
      currentAddress: {
        street: '89, Marathahalli',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560037',
        country: 'India'
      },
      permanentAddress: {
        street: '56, T Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600017',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Venkatesh Iyer',
        relationship: 'Father',
        mobile: '9876543281'
      },
      emergencyContact2: {
        name: 'Meena Iyer',
        relationship: 'Mother',
        mobile: '9876543282'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Kavya Iyer',
      dateJoined: new Date('2022-04-18'),
      department: 'Sales',
      jobTitle: 'Sales Executive',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'kavya.iyer@saeculum.com',
      attendanceBiometricId: 'BIO008',
      inProbation: true,
      probationDuration: 6,
      linkedinUrl: 'https://linkedin.com/in/kavya-iyer'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'XYZAB1234C',
      aadharNumber: '890123456789',
      bankName: 'IDBI Bank',
      branch: 'Marathahalli',
      personalAccountNumber: '89012345678901',
      personalIfsc: 'IBKL0008901',
      salaryAccountNumber: '89012345678901',
      salaryIfsc: 'IBKL0008901'
    }
  },
  {
    user: {
      email: 'rahul.verma@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Rahul Verma',
      gender: 'Male',
      dob: new Date('1989-02-28'),
      mobile: '9876543290',
      personalEmail: 'rahul.v89@gmail.com',
      bloodGroup: 'O+'
    },
    family: {
      fatherName: 'Mohan Verma',
      motherName: 'Radha Verma',
      maritalStatus: 'Married',
      spouseName: 'Pooja Verma',
      marriageDate: new Date('2013-03-15')
    },
    address: {
      currentAddress: {
        street: '34, Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        country: 'India'
      },
      permanentAddress: {
        street: '78, Hazratganj',
        city: 'Kanpur',
        state: 'Uttar Pradesh',
        pincode: '208001',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Pooja Verma',
        relationship: 'Spouse',
        mobile: '9876543291'
      },
      emergencyContact2: {
        name: 'Mohan Verma',
        relationship: 'Father',
        mobile: '9876543292'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Rahul Verma',
      dateJoined: new Date('2019-08-05'),
      department: 'Operations',
      jobTitle: 'Operations Manager',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'rahul.verma@saeculum.com',
      attendanceBiometricId: 'BIO009',
      inProbation: false,
      linkedinUrl: 'https://linkedin.com/in/rahul-verma'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'DEFGH5678L',
      aadharNumber: '901234567890',
      bankName: 'Punjab National Bank',
      branch: 'Bellandur',
      personalAccountNumber: '90123456789012',
      personalIfsc: 'PUNB0009012',
      salaryAccountNumber: '90123456789012',
      salaryIfsc: 'PUNB0009012'
    }
  },
  {
    user: {
      email: 'meera.joshi@saeculum.com',
      password: 'Welcome@123'
    },
    personal: {
      fullName: 'Meera Joshi',
      gender: 'Female',
      dob: new Date('1996-06-17'),
      mobile: '9876543300',
      personalEmail: 'meera.j96@gmail.com',
      bloodGroup: 'A+'
    },
    family: {
      fatherName: 'Prakash Joshi',
      motherName: 'Usha Joshi',
      maritalStatus: 'Single',
      spouseName: '',
      marriageDate: null
    },
    address: {
      currentAddress: {
        street: '56, JP Nagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560078',
        country: 'India'
      },
      permanentAddress: {
        street: '12, FC Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        country: 'India'
      }
    },
    emergency: {
      emergencyContact1: {
        name: 'Prakash Joshi',
        relationship: 'Father',
        mobile: '9876543301'
      },
      emergencyContact2: {
        name: 'Usha Joshi',
        relationship: 'Mother',
        mobile: '9876543302'
      }
    },
    professional: {
      nameAsPerAadhaar: 'Meera Joshi',
      dateJoined: new Date('2023-01-10'),
      department: 'Customer Support',
      jobTitle: 'Customer Support Executive',
      employmentType: 'Full-time',
      reportingManager: 'Vaidik',
      workEmail: 'meera.joshi@saeculum.com',
      attendanceBiometricId: 'BIO010',
      inProbation: true,
      probationDuration: 3,
      linkedinUrl: 'https://linkedin.com/in/meera-joshi'
    },
    bank: {
      companyOpensBank: false,
      panNumber: 'IJKLM9012N',
      aadharNumber: '012345678901',
      bankName: 'Yes Bank',
      branch: 'JP Nagar',
      personalAccountNumber: '01234567890123',
      personalIfsc: 'YESB0000123',
      salaryAccountNumber: '01234567890123',
      salaryIfsc: 'YESB0000123'
    }
  }
];

const seedEmployees = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGODB_DB_NAME
    });
    console.log('✅ MongoDB Connected');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const salt = await bcrypt.genSalt(10);
    let successCount = 0;
    let skipCount = 0;

    for (const empData of employeesData) {
      try {
        // Check if employee already exists
        const existingUser = await UserModel.findOne({ email: empData.user.email });
        if (existingUser) {
          console.log(`⏭️  Skipped: ${empData.personal.fullName} (${empData.user.email}) - Already exists`);
          skipCount++;
          continue;
        }

        // Generate employee code
        const emp_code = await generateEmpCode();

        // Create user
        const passwordHash = await bcrypt.hash(empData.user.password, salt);
        const user = new UserModel({
          email: empData.user.email,
          passwordHash,
          role: 'employee',
          emp_code: emp_code,
          status: 'approved'
        });
        await user.save();

        // Create personal details
        const personal = new EmployeePersonalModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.personal
        });
        await personal.save();

        // Create family details
        const family = new EmployeeFamilyModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.family
        });
        await family.save();

        // Create address details
        const address = new EmployeeAddressModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.address
        });
        await address.save();

        // Create emergency contact
        const emergency = new EmployeeEmergencyModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.emergency
        });
        await emergency.save();

        // Create professional details
        const professional = new EmployeeProfessionalModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.professional
        });
        await professional.save();

        // Create bank details
        const bank = new EmployeeBankModel({
          userId: user._id,
          emp_code: emp_code,
          ...empData.bank
        });
        await bank.save();

        console.log(`✅ Created: ${empData.personal.fullName} (${emp_code}) - ${empData.user.email}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error creating ${empData.personal.fullName}:`, error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SEED SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully Created: ${successCount}`);
    console.log(`⏭️  Skipped (Already Exist): ${skipCount}`);
    console.log(`📋 Total Employees: ${successCount + skipCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔑 Default Password for all: Welcome@123');
    console.log('⚠️
