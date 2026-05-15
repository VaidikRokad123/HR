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
    const existingHR = await UserModel.findOne({ email: 'vaidik@saeculum.com' });
    
    if (existingHR) {
      console.log('✅ HR user already exists!');
      console.log('Email: vaidik@saeculum.com');
      console.log('Employee Code: ' + existingHR.emp_code);
      
      console.log('\n📊 Database Status:');
      console.log('- HR user: ✓');
      console.log('- Counter initialized: ✓');
      process.exit(0);
    }

    // Ensure counter is updated to at least 2 so future employees get EMP0003+
    const counter = await CounterModel.findOne({ name: 'emp_code' });
    if (counter && counter.value < 2) {
      await CounterModel.findOneAndUpdate({ name: 'emp_code' }, { value: 2 });
    }
    
    // Assign specific EMP0001 code to Vaidik
    const emp_code = 'EMP0001';

    // Create HR user with employee code
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('vaidik123', salt);

    const hrUser = new UserModel({
      email: 'vaidik@saeculum.com',
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
      fullName: 'Vaidik',
      gender: 'Male',
      dob: new Date('2005-12-04'),
      age: 20,
      mobile: '9408534410',
      personalEmail: 'vaidik@saeculum.com',
      bloodGroup: 'O+'
    });
    await hrPersonal.save();

    // Create family details for HR
    const hrFamily = new EmployeeFamilyModel({
      userId: hrUser._id,
      emp_code: emp_code,
      fatherName: 'M',
      motherName: 'R',
      maritalStatus: 'Single'
    });
    await hrFamily.save();

    // Create address details for HR
    const hrAddress = new EmployeeAddressModel({
      userId: hrUser._id,
      emp_code: emp_code,
      currentAddress: {
        street: '1',
        city: 'Amreli',
        state: 'Gujarat',
        pincode: '365601',
        country: 'India'
      },
      permanentAddress: {
        street: '1',
        city: 'Amreli',
        state: 'Gujarat',
        pincode: '365601',
        country: 'India'
      }
    });
    await hrAddress.save();

    // Create emergency contact for HR
    const hrEmergency = new EmployeeEmergencyModel({
      userId: hrUser._id,
      emp_code: emp_code,
      emergencyContact1: {
        name: 'Vivek',
        relationship: 'Bro',
        mobile: '9408534410'
      }
    });
    await hrEmergency.save();

    // Create professional details for HR
    const hrProfessional = new EmployeeProfessionalModel({
      userId: hrUser._id,
      emp_code: emp_code,
      nameAsPerAadhaar: 'Vaidik',
      dateJoined: new Date('2012-12-12'),
      department: 'IT',
      jobTitle: 'CSE',
      reportingManager: 'P',
      workEmail: 'vaidik@saeculum.com',
      attendanceBiometricId: 'EMP0001',
      inProbation: true,
      linkedinUrl: 'https://www.linkedin.com/in/vaidik'
    });
    await hrProfessional.save();

    // Create bank details for HR
    const hrBank = new EmployeeBankModel({
      userId: hrUser._id,
      emp_code: emp_code,
      bankName: 'Saeculum Bank',
      branch: 'Amreli Branch',
      personalAccountNumber: '1234567890',
      personalIfsc: 'SAEC0001234',
    });
    await hrBank.save();

    console.log('\n✅ HR user created successfully with complete profile!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: vaidik@saeculum.com');
    console.log('🔑 Password: vaidik123');
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
