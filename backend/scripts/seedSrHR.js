import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';

dotenv.config();

const seedSrHR = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in the environment variables.");
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const email = 'sr.hr@example.com';
    const password = 'Welcome@123';
    const emp_code = 'SAE-HR01';

    // Check if the user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log('⚠️ Senior HR user already exists. Cleaning up existing data...');
      await UserModel.deleteOne({ email });
      await EmployeePersonalModel.deleteOne({ emp_code });
      await EmployeeProfessionalModel.deleteOne({ emp_code });
    }

    console.log('🌱 Seeding Senior HR user...');

    // 1. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 2. Create User Model
    const user = await UserModel.create({
      email,
      passwordHash,
      role: 'hr',
      status: 'approved',
      emp_code
    });

    console.log('✅ User account created');

    // 3. Create Personal Model
    await EmployeePersonalModel.create({
      userId: user._id,
      emp_code,
      fullName: 'Senior HR Administrator',
      gender: 'Other',
      dob: new Date('1990-01-01'),
      mobile: '9876543210',
      bloodGroup: 'O+'
    });

    console.log('✅ Personal details created');

    // 4. Create Professional Model
    await EmployeeProfessionalModel.create({
      userId: user._id,
      emp_code,
      nameAsPerAadhaar: 'Senior HR Administrator',
      dateJoined: new Date('2020-01-01'),
      department: 'Human Resources',
      jobTitle: 'Sr. Human Resource Executive', // This exact value grants Senior HR access based on authMiddleware
      employmentType: 'Permanent',
      workEmail: email
    });

    console.log('✅ Professional details created');

    console.log('🎉 Senior HR seeded successfully!');
    console.log('--------------------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     HR (Senior - Full Access)`);
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Senior HR:', err);
    process.exit(1);
  }
};

seedSrHR();
