import User from "../models/UserModel.js";
import Employee from "../models/EmployeeModel.js";
import NotificationLog from "../models/NotificationLogModel.js";
import { publish } from "../queues/publisher.js";
import { QUEUES } from "../queues/setup.js";
import { employeeQueryForUser } from "../utils/employeeCompat.js";

const isCompleteEmployeeProfile = (employee) => {
  if (!employee?.linkedinUrl) return false;

  if (employee.companyOpensBank) {
    return Boolean(
      employee.panNumber &&
      employee.aadharNumber &&
      employee.permissionToUsePanAadhar,
    );
  }

  return Boolean(
    employee.bankName && employee.accountNumber && employee.ifscCode,
  );
};

export async function runProfileCheck() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const approvedUsers = await User.find({
    status: "approved",
    emp_code: { $exists: true, $ne: null },
  });

  let notified = 0;

  for (const user of approvedUsers) {
    const employee = await Employee.findOne(employeeQueryForUser(user));
    if (
      !employee ||
      new Date(employee.createdAt || user.createdAt) > threeDaysAgo
    )
      continue;
    if (isCompleteEmployeeProfile(employee)) continue;

    const alreadySent = await NotificationLog.findOne({
      emp_code: user.emp_code,
      type: "profile_incomplete",
      year: currentYear,
    });
    if (alreadySent) continue;

    const daysLeft = Math.ceil(
      (today - new Date(employee.createdAt || user.createdAt)) / 86400000,
    );

    await publish(QUEUES.PROFILE, {
      emp_code: user.emp_code,
      email: user.email,
      daysLeft,
    });

    await NotificationLog.create({
      emp_code: user.emp_code,
      type: "profile_incomplete",
      year: currentYear,
    });

    notified++;
  }

  console.log(`[ProfileChecker] Notified ${notified} incomplete profile(s)`);
}
