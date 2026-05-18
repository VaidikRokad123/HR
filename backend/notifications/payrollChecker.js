import Employee from "../models/EmployeeModel.js";
import NotificationLog from "../models/NotificationLogModel.js";
import { publish } from "../queues/publisher.js";
import { QUEUES } from "../queues/setup.js";
import { hasPayrollDetails } from "../utils/employeeCompat.js";

export async function runPayrollCheck() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const employees = await Employee.find({
    emp_code: { $exists: true, $ne: null },
    dateJoining: { $lte: sevenDaysAgo },
    exitDate: { $eq: null },
  });

  let notified = 0;

  for (const emp of employees) {
    if (hasPayrollDetails(emp)) continue;

    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type: "payroll_pending",
      year: currentYear,
    });
    if (alreadySent) continue;

    await publish(QUEUES.PAYROLL, {
      emp_code: emp.emp_code,
      name: emp.fullName || emp.emp_code,
      dateJoined: emp.dateJoining,
      department: emp.department,
    });

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type: "payroll_pending",
      year: currentYear,
    });

    notified++;
  }

  console.log(`[PayrollChecker] Notified ${notified} payroll pending case(s)`);
}
