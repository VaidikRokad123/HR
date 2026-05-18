import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import UserModel from "../models/UserModel.js";
import EmployeeModel from "../models/EmployeeModel.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const seedSrHR = async () => {
  try {
    if (!process.env.MONGODB_URI)
      throw new Error(
        "MONGODB_URI is not defined in the environment variables.",
      );
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const email = "sr.hr@example.com";
    const password = "Welcome@123";
    const emp_code = "SAE-HR01";

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log(
        "⚠️ Senior HR user already exists. Cleaning up existing data...",
      );
      await UserModel.deleteOne({ email });
      await EmployeeModel.deleteOne({ emp_code });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      email,
      passwordHash,
      role: "hr",
      status: "approved",
      emp_code,
    });
    await EmployeeModel.create({
      userId: user._id,
      emp_code,
      fullName: "Senior HR Administrator",
      gender: "Other",
      dob: new Date("1990-01-01"),
      maritalStatus: "Single",
      personalMobile: "9876543210",
      personalEmail: email,
      bloodGroup: "O+",
      aadharNumber: "not set yet",
      panNumber: "not set yet",
      highestQualification: "not set yet",
      graduationYear: 2012,
      instituteName: "not set yet",
      dateJoining: new Date("2020-01-01"),
      department: "Human Resources",
      designation: "Sr. Human Resource Executive",
      employmentType: "Permanent",
      workLocation: "Office",
      officialEmail: email,
    });

    console.log("🎉 Senior HR seeded successfully!");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Senior HR:", err);
    process.exit(1);
  }
};

seedSrHR();
