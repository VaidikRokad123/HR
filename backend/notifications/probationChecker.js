import Employee from "../models/EmployeeModel.js";
import NotificationLog from "../models/NotificationLogModel.js";
import { publish } from "../queues/publisher.js";
import { QUEUES } from "../queues/setup.js";

export async function runProbationCheck() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const employees = await Employee.find({
    inProbation: true,
    probationEndedNotified: false,
    dateJoining: { $exists: true, $ne: null },
    probationMonths: { $exists: true, $ne: null },
  });

  let notified = 0;

  for (const emp of employees) {
    const probationEnd = new Date(emp.dateJoining);
    probationEnd.setMonth(probationEnd.getMonth() + (emp.probationMonths || 6));

    const daysLeft = Math.ceil((probationEnd - today) / 86400000);
    if (daysLeft < 0 || daysLeft > 7) continue;

    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type: "probation",
      year: currentYear,
    });
    if (alreadySent) continue;

    await publish(QUEUES.PROBATION, {
      emp_code: emp.emp_code,
      name: emp.fullName || emp.emp_code,
      probationEnd,
      daysLeft,
    });

    emp.probationEndedNotified = true;
    await emp.save();

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type: "probation",
      year: currentYear,
    });

    notified++;
  }

  console.log(
    `[ProbationChecker] Notified ${notified} upcoming probation end(s)`,
  );
}
