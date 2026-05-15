import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UserModel from '../models/UserModel.js';
import EmployeePersonalModel from '../models/EmployeePersonalModel.js';
import EmployeeProfessionalModel from '../models/EmployeeProfessionalModel.js';

dotenv.config();

const seedTestEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const today = new Date();
    
    // Date exactly 7 days from now
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    // 1. Birthday (DOB is 7 days from now, arbitrary year)
    const bdayDob = new Date(in7Days);
    bdayDob.setFullYear(1995);

    // 2. Work Anniversary (Joined exactly 1 year and -7 days ago)
    const annivJoin = new Date(in7Days);
    annivJoin.setFullYear(today.getFullYear() - 1);

    // 3. Probation Ending (Joined exactly 6 months and -7 days ago)
    const probJoin = new Date(in7Days);
    probJoin.setMonth(probJoin.getMonth() - 6);

    // 4. Incomplete Profile (Approved 4 days ago)
    const incompleteUpdated = new Date(today);
    incompleteUpdated.setDate(today.getDate() - 4);

    // 5. Payroll Pending (Joined 8 days ago)
    const payrollJoin = new Date(today);
    payrollJoin.setDate(today.getDate() - 8);

    const testCases = [
      {
        email: 'test.birthday@example.com',
        emp_code: 'TEST-BDAY',
        name: 'Test Birthday User',
        personal: { dob: bdayDob },
        professional: { dateJoined: new Date() }
      },
      {
        email: 'test.anniv@example.com',
        emp_code: 'TEST-ANNIV',
        name: 'Test Anniversary User',
        personal: { dob: new Date('1990-01-01') },
        professional: { dateJoined: annivJoin, exitDate: null }
      },
      {
        email: 'test.probation@example.com',
        emp_code: 'TEST-PROB',
        name: 'Test Probation User',
        personal: { dob: new Date('1992-01-01') },
        professional: { 
          dateJoined: probJoin, 
          inProbation: true, 
          probationDuration: 6, 
          probationEndedNotified: false 
        }
      },
      {
        email: 'test.incomplete@example.com',
        emp_code: 'TEST-INC',
        name: 'Test Incomplete User',
        personal: { dob: new Date('1994-01-01') },
        professional: { dateJoined: new Date() },
        userOverride: { updatedAt: incompleteUpdated }
      },
      {
        email: 'test.payroll@example.com',
        emp_code: 'TEST-PAY',
        name: 'Test Payroll User',
        personal: { dob: new Date('1996-01-01') },
        professional: { dateJoined: payrollJoin, exitDate: null, department: 'Engineering' }
      }
    ];

    for (const t of testCases) {
      // Clean up previous test runs
      await UserModel.deleteOne({ email: t.email });
      await EmployeePersonalModel.deleteOne({ emp_code: t.emp_code });
      await EmployeeProfessionalModel.deleteOne({ emp_code: t.emp_code });

      // Create User
      const user = await UserModel.create({
        email: t.email,
        passwordHash: 'dummy',
        role: 'employee',
        status: 'approved',
        emp_code: t.emp_code,
        createdAt: t.userOverride?.updatedAt || new Date(),
        updatedAt: t.userOverride?.updatedAt || new Date()
      });

      // Create Personal
      await EmployeePersonalModel.create({
        userId: user._id,
        emp_code: t.emp_code,
        fullName: t.name,
        mobile: '9876543210',
        gender: 'Male',
        bloodGroup: 'O+',
        ...t.personal
      });

      // Create Professional
      await EmployeeProfessionalModel.create({
        userId: user._id,
        emp_code: t.emp_code,
        department: 'Engineering',
        jobTitle: 'Software Development Engineer - SDE 1',
        workEmail: t.email,
        ...t.professional
      });
    }

    console.log('✅ Dummy data seeded successfully!');
    console.log('👉 Go to the Upcoming Events Dashboard in your browser and refresh the page.');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedTestEvents();
