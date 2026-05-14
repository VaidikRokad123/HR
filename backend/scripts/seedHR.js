import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel from '../models/UserModel.js';
import CounterModel from '../models/CounterModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeFamilyModel from '../models/EmployeeFamilyModel.js';
import EmployeeAddressModel from '../models/EmployeeAddressModel.js';
import EmployeeEmergencyModel from '../models/EmployeeEmergencyModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';
import EmployeeBankModel from '../models/EmployeeBankModel.js';

dotenv.config();

const seedHR = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGODB_DB_NAME
    });
    console.log('MongoDB Connected');

    // Initialize employee code counter
    const existingCounter = await CounterModel.findOne({ name: 'emp_code' });
    if (!existingCounter) {
      await CounterModel.create({ name: 'emp_code', value: 0 });
      console.log('✅ Employee code counter initialized');
    } else {
      console.log('✅ Employee code counter already exists (current value: ' + existingCounter.value + ')');
    }

    // Check if HR user already exists
    const existingHR = await UserModel.findOne({ email: 'hr@company.com' });
    
    if (existingHR) {
      console.log('✅ HR user already exists!');
      console.log('Email: hr@company.com');
      console.log('Employee Code: ' + existingHR.emp_code);
      console.log('\n📊 Database Status:');
      console.log('- HR user: ✓');
      console.log('- Counter initialized: ✓');
      process.exit(0);
    }

    // Generate employee code for HR
    const counter = await CounterModel.findOneAndUpdate(
      { name: 'emp_code' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    const emp_code = `EMP${String(counter.value).padStart(4, '0')}`;

    // Create HR user with employee code
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('hr123456', salt);

    const hrUser = new UserModel({
      email: 'hr@company.com',
      passwordHash,
      role: 'hr',
      emp_code: emp_code,
      status: 'approved'
    });

    await hrUser.save();

    // Create personal details for HR
    const hrPersonal = new EmployeePersonalModel({
      userId: hrUser._id,
      emp_code: emp_code,
      fullName: 'HR Administrator',
      gender: 'Other',
      dob: new Date('1990-01-01'),
      age: new Date().getFullYear() - 1990,
      mobile: '0000000000',
      personalEmail: 'hr@company.com',
      bloodGroup: 'O+'
    });
    await hrPersonal.save();

    // Create family details for HR
    const hrFamily = new EmployeeFamilyModel({
      userId: hrUser._id,
      emp_code: emp_code,
      fatherName: 'N/A',
      motherName: 'N/A',
      married: false
    });
    await hrFamily.save();

    // Create address details for HR
    const hrAddress = new EmployeeAddressModel({
      userId: hrUser._id,
      emp_code: emp_code,
      currentAddress: {
        street: 'Company Headquarters',
        city: 'City',
        state: 'State',
        pincode: '000000',
        country: 'India'
      },
      permanentAddress: {
        street: 'Company Headquarters',
        city: 'City',
        state: 'State',
        pincode: '000000',
        country: 'India'
      }
    });
    await hrAddress.save();

    // Create emergency contact for HR
    const hrEmergency = new EmployeeEmergencyModel({
      userId: hrUser._id,
      emp_code: emp_code,
      emergencyContact1: {
        name: 'Emergency Contact',
        relationship: 'Other',
        mobile: '0000000000'
      }
    });
    await hrEmergency.save();

    // Create professional details for HR
    const hrProfessional = new EmployeeProfessionalModel({
      userId: hrUser._id,
      emp_code: emp_code,
      nameAsPerAadhaar: 'HR Administrator',
      dateJoined: new Date(),
      department: 'Human Resources',
      jobTitle: 'HR Manager',
      reportingManager: 'CEO',
      workEmail: 'hr@company.com',
      attendanceBiometricId: 'HR001',
      inProbation: false,
      linkedinUrl: 'https://www.linkedin.com/company/yourcompany'
    });
    await hrProfessional.save();

    // Create bank details for HR
    const hrBank = new EmployeeBankModel({
      userId: hrUser._id,
      emp_code: emp_code,
      bankName: 'Company Bank',
      branch: 'Main Branch',
      personalAccountNumber: '0000000000',
      personalIfsc: 'BANK0000000',
      salaryAccountNumber: '0000000000',
      salaryIfsc: 'BANK0000000'
    });
    await hrBank.save();

    console.log('\n✅ HR user created successfully with complete profile!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: hr@company.com');
    console.log('🔑 Password: hr123456');
    console.log('👤 Employee Code: ' + emp_code);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');
    console.log('\n✓ You can now login with these credentials.');
    console.log('✓ HR user has complete employee profile (personal, family, address, emergency, professional, bank)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding HR user:', error);
    process.exit(1);
  }
};

seedHR();
