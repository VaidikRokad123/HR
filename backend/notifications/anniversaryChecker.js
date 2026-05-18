import Employee from "../models/EmployeeModel.js";
import NotificationLog from "../models/NotificationLogModel.js";
import { publish } from "../queues/publisher.js";
import { QUEUES } from "../queues/setup.js";

export async function runAnniversaryCheck() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const targetDates = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    targetDates.push({
      month: d.getMonth() + 1,
      day: d.getDate(),
      daysLeft: i,
    });
  }

  const matchConditions = targetDates.map((t) => ({
    joinMonth: t.month,
    joinDay: t.day,
  }));

  const employees = await Employee.aggregate([
    {
      $match: {
        emp_code: { $exists: true, $ne: null },
        dateJoining: { $exists: true, $ne: null },
        exitDate: { $eq: null }, // skip exited employees
      },
    },
    {
      $addFields: {
        joinMonth: { $month: "$dateJoining" },
        joinDay: { $dayOfMonth: "$dateJoining" },
        joiningYear: { $year: "$dateJoining" },
        yearsCompleted: { $subtract: [currentYear, { $year: "$dateJoining" }] },
      },
    },
    {
      $match: {
        joiningYear: { $lt: currentYear }, // not a new joiner this year
        $or: matchConditions,
      },
    },
  ]);

  console.log(
    `[AnniversaryChecker] Found ${employees.length} upcoming work anniversary(s) within 7 days`,
  );

  for (const emp of employees) {
    const alreadySent = await NotificationLog.findOne({
      emp_code: emp.emp_code,
      type: "anniversary",
      year: currentYear,
    });
    if (alreadySent) continue;

    const target = targetDates.find(
      (t) => t.month === emp.joinMonth && t.day === emp.joinDay,
    );
    const daysLeft = target ? target.daysLeft : 7;

    await publish(QUEUES.ANNIVERSARY, {
      emp_code: emp.emp_code,
      name: emp.fullName || emp.emp_code,
      dateJoined: emp.dateJoining,
      yearsCompleted: emp.yearsCompleted,
      daysLeft: daysLeft,
    });

    await NotificationLog.create({
      emp_code: emp.emp_code,
      type: "anniversary",
      year: currentYear,
    });
  }
}
