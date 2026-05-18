import mongoose from "mongoose";
import dotenv from "dotenv";
import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";

dotenv.config();

const seedTestEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const bdayDob = new Date(in7Days);
    bdayDob.setFullYear(1995);

    const annivJoin = new Date(in7Days);
    annivJoin.setFullYear(today.getFullYear() - 1);

    const probJoin = new Date(in7Days);
    probJoin.setMonth(probJoin.getMonth() - 6);

    const payrollJoin = new Date(today);
    payrollJoin.setDate(today.getDate() - 8);

    const testCases = [
      {
        email: "test.birthday@example.com",
        emp_code: "TEST-BDAY",
        name: "Test Birthday User",
        dob: bdayDob,
        dateJoining: new Date(),
      },
      {
        email: "test.anniv@example.com",
        emp_code: "TEST-ANNIV",
        name: "Test Anniversary User",
        dob: new Date("1990-01-01"),
        dateJoining: annivJoin,
      },
      {
        email: "test.probation@example.com",
        emp_code: "TEST-PROB",
        name: "Test Probation User",
        dob: new Date("1992-01-01"),
        dateJoining: probJoin,
        inProbation: true,
        probationMonths: 6,
        probationEndedNotified: false,
      },
      {
        email: "test.incomplete@example.com",
        emp_code: "TEST-INC",
        name: "Test Incomplete User",
        dob: new Date("1994-01-01"),
        dateJoining: new Date(),
      },
      {
        email: "test.payroll@example.com",
        emp_code: "TEST-PAY",
        name: "Test Payroll User",
        dob: new Date("1996-01-01"),
        dateJoining: payrollJoin,
        department: "Engineering",
      },
    ];

    for (const t of testCases) {
      await UserModel.deleteOne({ email: t.email });
      await EmployeeModel.deleteOne({ emp_code: t.emp_code });

      const user = await UserModel.create({
        email: t.email,
        status: "approved",
        emp_code: t.emp_code,
      });
      await EmployeeModel.create({
        userId: user._id,
        emp_code: t.emp_code,
        fullName: t.name,
        personalMobile: "9876543210",
        personalEmail: t.email,
        gender: "Male",
        maritalStatus: "Single",
        bloodGroup: "O+",
        dob: t.dob,
        aadharNumber: "not set yet",
        panNumber: "not set yet",
        highestQualification: "not set yet",
        graduationYear: 2020,
        instituteName: "not set yet",
        department: t.department || "Engineering",
        designation: "Software Development Engineer - SDE 1",
        officialEmail: t.email,
        workLocation: "Office",
        employmentType: "Permanent",
        ...t,
      });
    }

    console.log("✅ Dummy EmployeeModel event data seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

seedTestEvents();
