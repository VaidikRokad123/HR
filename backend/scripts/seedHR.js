import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import UserModel from "../models/UserModel.js";
import CounterModel from "../models/CounterModel.js";
import EmployeeModel from "../models/EmployeeModel.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const seedHR = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    });
    console.log("MongoDB Connected");

    const existingCounter = await CounterModel.findOne({ name: "emp_code" });
    if (!existingCounter)
      await CounterModel.create({ name: "emp_code", value: 0 });

    const existingHR = await UserModel.findOne({
      email: "vaidik@saeculum.com",
    });
    if (existingHR) {
      console.log("✅ HR user already exists by email!");
      console.log("Email: vaidik@saeculum.com");
      console.log("Employee Code: " + existingHR.emp_code);
      process.exit(0);
    }

    const emp_code = "EMP0001";
    const existingEmpCode = await UserModel.findOne({ emp_code });
    if (existingEmpCode) {
      console.log(
        `⚠️ User with ${emp_code} already exists. Cleaning up existing data...`,
      );
      await UserModel.deleteOne({ emp_code });
      await EmployeeModel.deleteOne({ emp_code });
    }

    const counter = await CounterModel.findOne({ name: "emp_code" });
    if (counter && counter.value < 2)
      await CounterModel.findOneAndUpdate({ name: "emp_code" }, { value: 2 });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("vaidik123", salt);

    const hrUser = await UserModel.create({
      email: "vaidik@saeculum.com",
      passwordHash,
      role: "hr",
      emp_code,
      status: "approved",
    });

    await EmployeeModel.create({
      userId: hrUser._id,
      emp_code,
      fullName: "Vaidik",
      gender: "Male",
      dob: new Date("2005-12-04"),
      maritalStatus: "Single",
      personalMobile: "9408534410",
      personalEmail: "vaidik@saeculum.com",
      bloodGroup: "O+",
      currentAddress: {
        street: "1",
        city: "Amreli",
        state: "Gujarat",
        pincode: "365601",
        country: "India",
      },
      sameAsCurrent: true,
      emergencyContacts: [
        { name: "Vivek", relationship: "Bro", phone: "9408534410" },
      ],
      aadharNumber: "not set yet",
      panNumber: "not set yet",
      highestQualification: "not set yet",
      graduationYear: 2023,
      instituteName: "not set yet",
      dateJoining: new Date("2012-12-12"),
      department: "Human Resources",
      designation: "Sr. Human Resource Executive",
      reportingManager: "P",
      officialEmail: "vaidik@saeculum.com",
      employmentType: "Permanent",
      workLocation: "Office",
      linkedinUrl: "https://www.linkedin.com/in/vaidik",
      bankNameBranch: "Saeculum Bank",
      branch: "Amreli Branch",
      accountNumber: "1234567890",
      ifscCode: "SAEC0001234",
    });

    console.log(
      "\n✅ HR user created successfully with EmployeeModel profile!",
    );
    console.log("📧 Email: vaidik@saeculum.com");
    console.log("🔑 Password: vaidik123");
    console.log("👤 Employee Code: " + emp_code);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding HR user:", error);
    process.exit(1);
  }
};

seedHR();
